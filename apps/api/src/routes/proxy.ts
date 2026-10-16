import { Readable } from "node:stream"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { File as MegaFile } from "megajs"
import { db, isDbAvailable } from "../db"
import { comics } from "../db/schema"

const MEDIAFIRE_CACHE_TTL_MS = 10 * 60 * 1000
const MEDIAFIRE_CACHE_MAX_ENTRIES = 500
const MAX_REDIRECTS = 5
const DOWNLOAD_FAILED_MESSAGE = "Não foi possível baixar o arquivo."

// Erro com mensagem que pode ir para o navegador. Qualquer outro erro vira uma mensagem genérica,
// para não vazar detalhes internos.
class ProxyError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

interface CachedResolvedUrl {
  directUrl: string
  expiresAt: number
}

function extractGDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

function isGDriveUrl(url: string): boolean {
  const hostname = getHostname(url)
  return hostname === "drive.google.com" || hostname === "docs.google.com"
}

function isMediaFireUrl(url: string): boolean {
  const hostname = getHostname(url)
  return hostname === "mediafire.com" || hostname?.endsWith(".mediafire.com") === true
}

function isMegaUrl(url: string): boolean {
  const hostname = getHostname(url)
  return (
    hostname === "mega.nz" ||
    hostname === "mega.co.nz" ||
    hostname?.endsWith(".mega.nz") === true ||
    hostname?.endsWith(".mega.co.nz") === true
  )
}

const PRIVATE_IPV4_PATTERNS = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^(22[4-9]|2[3-5]\d)\./,
]

// Barra endereços internos (localhost, rede privada, metadados da nuvem) para que o proxy não sirva
// de ponte para dentro da infraestrutura (SSRF).
function isPublicHttpUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false
  if (parsed.username || parsed.password) return false

  const hostname = parsed.hostname.toLowerCase()
  if (!hostname.includes(".") || hostname.startsWith("[")) return false
  if (
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return !PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(hostname))
  }

  return true
}

// Links fora de Google Drive, MediaFire e MEGA só passam se forem o download de uma HQ cadastrada.
async function isRegisteredDownloadUrl(url: string): Promise<boolean> {
  if (!isDbAvailable) return false

  const [comic] = await db!
    .select({ id: comics.id })
    .from(comics)
    .where(eq(comics.downloadUrl, url))
    .limit(1)

  return Boolean(comic)
}

// Segue redirecionamentos manualmente para conferir cada destino, em vez de deixar o fetch ir
// para onde o servidor remoto mandar.
async function fetchPublicUrl(url: string): Promise<Response> {
  let currentUrl = url

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    if (!isPublicHttpUrl(currentUrl)) {
      throw new ProxyError("Endereço de download não permitido.")
    }

    const response = await fetch(currentUrl, { headers: PROXY_HEADERS, redirect: "manual" })
    const location =
      response.status >= 300 && response.status < 400 ? response.headers.get("location") : null

    if (!location) return response

    await response.body?.cancel()
    currentUrl = new URL(location, currentUrl).toString()
  }

  throw new Error("Redirecionamentos demais ao baixar o arquivo")
}

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") || ""
  return contentType.includes("text/html")
}

function inferContentType(filename: string): string {
  const normalizedFilename = filename.toLowerCase()

  if (normalizedFilename.endsWith(".cbr")) return "application/x-cbr"
  if (normalizedFilename.endsWith(".cbz")) return "application/vnd.comicbook+zip"
  if (normalizedFilename.endsWith(".pdf")) return "application/pdf"
  if (normalizedFilename.endsWith(".zip")) return "application/zip"

  return "application/octet-stream"
}

function createAttachmentDisposition(filename: string): string {
  const fallbackFilename =
    filename
      .replaceAll(/[\u0080-\uFFFF]/g, "_")
      .replaceAll('"', "")
      .replaceAll("\\", "")
      .trim() || "download"

  return `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

function extractMediaFireDownloadUrl(html: string, baseUrl: string): string | null {
  const patterns = [
    /<a[^>]*id=["']downloadButton["'][^>]*href=["']([^"']+)["']/i,
    /<a[^>]*href=["']([^"']+)["'][^>]*id=["']downloadButton["']/i,
    /kNO\s*=\s*["']([^"']+)["']/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    const rawUrl = match?.[1]

    if (!rawUrl) continue

    const normalizedUrl = rawUrl
      .trim()
      .replaceAll("&amp;", "&")
      .replaceAll("&#38;", "&")
      .replace(/^\/\//, "https://")

    try {
      return new URL(normalizedUrl, baseUrl).toString()
    } catch {
      // Ignore invalid matches and keep looking for the real download link.
    }
  }

  return null
}

const PROXY_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

const mediaFireDirectUrlCache = new Map<string, CachedResolvedUrl>()

function getCachedMediaFireDirectUrl(url: string): string | null {
  const cached = mediaFireDirectUrlCache.get(url)

  if (!cached) return null

  if (cached.expiresAt <= Date.now()) {
    mediaFireDirectUrlCache.delete(url)
    return null
  }

  return cached.directUrl
}

function setCachedMediaFireDirectUrl(url: string, directUrl: string): void {
  if (mediaFireDirectUrlCache.size >= MEDIAFIRE_CACHE_MAX_ENTRIES) {
    const oldestKey = mediaFireDirectUrlCache.keys().next().value
    if (oldestKey !== undefined) mediaFireDirectUrlCache.delete(oldestKey)
  }

  mediaFireDirectUrlCache.set(url, {
    directUrl,
    expiresAt: Date.now() + MEDIAFIRE_CACHE_TTL_MS,
  })
}

async function fetchFromGDrive(url: string): Promise<Response> {
  const fileId = extractGDriveFileId(url)
  if (!fileId) throw new Error("ID do arquivo não encontrado na URL do Google Drive")

  const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`

  const response = await fetch(directUrl, {
    headers: PROXY_HEADERS,
    redirect: "follow",
  })

  if (!response.ok) throw new Error(`Google Drive retornou ${response.status}`)

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("text/html")) {
    throw new Error("Google Drive retornou HTML em vez do arquivo")
  }

  return response
}

async function fetchFromMediaFire(url: string): Promise<Response> {
  const cachedDirectUrl = getCachedMediaFireDirectUrl(url)
  if (cachedDirectUrl) {
    const cachedResponse = await fetch(cachedDirectUrl, {
      headers: PROXY_HEADERS,
      redirect: "follow",
    })

    if (cachedResponse.ok && !isHtmlResponse(cachedResponse)) {
      return cachedResponse
    }

    mediaFireDirectUrlCache.delete(url)
  }

  const response = await fetch(url, {
    headers: PROXY_HEADERS,
    redirect: "follow",
  })

  if (!response.ok) throw new Error(`MediaFire retornou ${response.status}`)

  if (!isHtmlResponse(response)) {
    return response
  }

  const html = await response.text()
  const directUrl = extractMediaFireDownloadUrl(html, response.url || url)

  if (!directUrl) {
    throw new Error("Link de download do MediaFire não encontrado")
  }

  // O link sai do HTML da página; só seguimos se ele continuar dentro do MediaFire.
  if (!isMediaFireUrl(directUrl) || !isPublicHttpUrl(directUrl)) {
    throw new Error(`MediaFire apontou para um domínio inesperado: ${directUrl}`)
  }

  setCachedMediaFireDirectUrl(url, directUrl)

  const downloadResponse = await fetch(directUrl, {
    headers: PROXY_HEADERS,
    redirect: "follow",
  })

  if (!downloadResponse.ok) {
    throw new Error(`MediaFire retornou ${downloadResponse.status}`)
  }

  if (isHtmlResponse(downloadResponse)) {
    throw new Error("MediaFire retornou HTML em vez do arquivo")
  }

  return downloadResponse
}

async function fetchFromMega(url: string): Promise<Response> {
  const file = MegaFile.fromURL(url)

  if (file.directory) {
    throw new Error("Pastas do MEGA não são suportadas")
  }

  await file.loadAttributes()

  const filename = file.name?.trim() || "comic.cbr"
  const contentType = inferContentType(filename)
  const headers = new Headers({
    "cache-control": "public, max-age=3600",
    "content-disposition": createAttachmentDisposition(filename),
    "content-type": contentType,
  })

  if (typeof file.size === "number" && Number.isFinite(file.size)) {
    headers.set("content-length", String(file.size))
  }

  const downloadStream = file.download({})

  return new Response(Readable.toWeb(downloadStream as Readable), {
    headers,
  })
}

export const proxy = new Elysia({ prefix: "/proxy" }).get(
  "/download",
  async ({ query, set }) => {
    const { url } = query

    if (!url) {
      set.status = 400
      return { error: "URL é obrigatória" }
    }

    if (!isPublicHttpUrl(url)) {
      set.status = 400
      return { error: "Endereço de download não permitido." }
    }

    try {
      const response = isGDriveUrl(url)
        ? await fetchFromGDrive(url)
        : isMediaFireUrl(url)
          ? await fetchFromMediaFire(url)
          : isMegaUrl(url)
            ? await fetchFromMega(url)
            : (await isRegisteredDownloadUrl(url))
              ? await fetchPublicUrl(url)
              : null

      if (!response) {
        set.status = 400
        return { error: "Endereço de download não permitido." }
      }

      if (!response.ok) {
        set.status = response.status
        return { error: `Erro ao baixar arquivo: ${response.status}` }
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream"
      const contentLength = response.headers.get("content-length")
      const disposition = response.headers.get("content-disposition")
      const cacheControl = response.headers.get("cache-control") || "public, max-age=3600"
      const etag = response.headers.get("etag")
      const lastModified = response.headers.get("last-modified")

      set.headers["content-type"] = contentType
      set.headers["access-control-expose-headers"] =
        "content-length, content-disposition, cache-control, etag, last-modified"
      set.headers["cache-control"] = cacheControl

      if (disposition) {
        set.headers["content-disposition"] = disposition
      }

      if (contentLength) {
        set.headers["content-length"] = contentLength
      }

      if (etag) {
        set.headers.etag = etag
      }

      if (lastModified) {
        set.headers["last-modified"] = lastModified
      }

      return response
    } catch (error) {
      if (error instanceof ProxyError) {
        set.status = error.status
        return { error: error.message }
      }

      console.error("Erro no proxy:", error)
      set.status = 500
      return { error: DOWNLOAD_FAILED_MESSAGE }
    }
  },
  {
    query: t.Object({
      url: t.String({ maxLength: 2048 }),
    }),
  },
)
