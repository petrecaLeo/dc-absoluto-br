import { Elysia, t } from "elysia"

const MEDIAFIRE_CACHE_TTL_MS = 10 * 60 * 1000

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

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") || ""
  return contentType.includes("text/html")
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

export const proxy = new Elysia({ prefix: "/proxy" }).get(
  "/download",
  async ({ query, set }) => {
    const { url } = query

    if (!url) {
      set.status = 400
      return { error: "URL é obrigatória" }
    }

    try {
      const response = isGDriveUrl(url)
        ? await fetchFromGDrive(url)
        : isMediaFireUrl(url)
          ? await fetchFromMediaFire(url)
          : await fetch(url, { headers: PROXY_HEADERS, redirect: "follow" })

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
      set.headers["access-control-allow-origin"] = "*"
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
      console.error("Erro no proxy:", error)
      set.status = 500
      return {
        error: error instanceof Error ? error.message : "Erro interno ao processar download",
      }
    }
  },
  {
    query: t.Object({
      url: t.String(),
    }),
  },
)
