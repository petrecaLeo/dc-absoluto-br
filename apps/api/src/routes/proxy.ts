import { Elysia, t } from "elysia"

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

function isGDriveUrl(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com/.test(url)
}

const GDRIVE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

async function fetchFromGDrive(url: string): Promise<Response> {
  const fileId = extractGDriveFileId(url)
  if (!fileId) throw new Error("ID do arquivo não encontrado na URL do Google Drive")

  const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`

  const response = await fetch(directUrl, {
    headers: GDRIVE_HEADERS,
    redirect: "follow",
  })

  if (!response.ok) throw new Error(`Google Drive retornou ${response.status}`)

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("text/html")) {
    throw new Error("Google Drive retornou HTML em vez do arquivo")
  }

  return response
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
        : await fetch(url, { headers: GDRIVE_HEADERS, redirect: "follow" })

      if (!response.ok) {
        set.status = response.status
        return { error: `Erro ao baixar arquivo: ${response.status}` }
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream"
      const contentLength = response.headers.get("content-length")

      const disposition = response.headers.get("content-disposition")

      set.headers["content-type"] = contentType
      set.headers["access-control-allow-origin"] = "*"
      set.headers["access-control-expose-headers"] = "content-length, content-disposition"

      if (disposition) {
        set.headers["content-disposition"] = disposition
      }

      if (contentLength) {
        set.headers["content-length"] = contentLength
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
