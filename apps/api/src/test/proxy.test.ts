import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { Readable } from "node:stream"

interface MockMegaFile {
  directory: boolean
  name?: string | null
  size?: number
  loadAttributes: () => Promise<unknown>
  download: () => Readable
}

const megaFromUrlCalls: string[] = []
let queuedMegaFiles: MockMegaFile[] = []

mock.module("megajs", () => ({
  File: {
    fromURL(url: string): MockMegaFile {
      megaFromUrlCalls.push(url)

      const file = queuedMegaFiles.shift()
      if (!file) {
        throw new Error("Nenhum arquivo MEGA mockado para este teste")
      }

      return file
    },
  },
}))

const { createApp } = await import("../index")

const originalFetch = globalThis.fetch

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()
  return input.url
}

describe("Proxy endpoints", () => {
  const app = createApp()
  let queuedResponses: Response[]
  let fetchCalls: Array<{ url: string; init?: RequestInit }>

  beforeEach(() => {
    queuedResponses = []
    fetchCalls = []
    queuedMegaFiles = []
    megaFromUrlCalls.length = 0

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls.push({ url: getRequestUrl(input), init })

      const response = queuedResponses.shift()
      if (!response) {
        throw new Error("Nenhuma resposta mockada para fetch")
      }

      return response
    }) as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("keeps Google Drive downloads working through the direct endpoint", async () => {
    queuedResponses.push(
      new Response("drive-file", {
        headers: {
          "content-type": "application/x-cbr",
          "content-length": "10",
          "content-disposition": 'attachment; filename="absolute-batman.cbr"',
          "cache-control": "public, max-age=7200",
          etag: '"drive-etag"',
        },
      }),
    )

    const driveUrl = "https://drive.google.com/file/d/abc123/view?usp=sharing"
    const response = await app.handle(
      new Request(`http://localhost/api/proxy/download?url=${encodeURIComponent(driveUrl)}`),
    )

    expect(response.status).toBe(200)
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0]?.url).toBe(
      "https://drive.usercontent.google.com/download?id=abc123&export=download&confirm=t",
    )
    expect(response.headers.get("content-type")).toBe("application/x-cbr")
    expect(response.headers.get("content-length")).toBe("10")
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="absolute-batman.cbr"',
    )
    expect(response.headers.get("cache-control")).toBe("public, max-age=7200")
    expect(response.headers.get("etag")).toBe('"drive-etag"')
    expect(await response.text()).toBe("drive-file")
  })

  it("resolves MediaFire pages into the real file download", async () => {
    queuedResponses.push(
      new Response(
        '<html><body><a id="downloadButton" href="//download1500.mediafire.com/abc/comic.cbr">Baixar</a></body></html>',
        {
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        },
      ),
      new Response("mediafire-file", {
        headers: {
          "content-type": "application/x-cbr",
          "content-length": "14",
        },
      }),
    )

    const mediaFireUrl = "https://www.mediafire.com/file/abc123/comic.cbr/file"
    const response = await app.handle(
      new Request(`http://localhost/api/proxy/download?url=${encodeURIComponent(mediaFireUrl)}`),
    )

    expect(response.status).toBe(200)
    expect(fetchCalls.map((call) => call.url)).toEqual([
      mediaFireUrl,
      "https://download1500.mediafire.com/abc/comic.cbr",
    ])
    expect(response.headers.get("content-type")).toBe("application/x-cbr")
    expect(response.headers.get("content-length")).toBe("14")
    expect(await response.text()).toBe("mediafire-file")
  })

  it("reuses cached MediaFire direct links on subsequent requests", async () => {
    queuedResponses.push(
      new Response(
        '<html><body><a id="downloadButton" href="//download1501.mediafire.com/xyz/comic.cbr">Baixar</a></body></html>',
        {
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        },
      ),
      new Response("first-mediafire-file", {
        headers: {
          "content-type": "application/x-cbr",
        },
      }),
      new Response("cached-mediafire-file", {
        headers: {
          "content-type": "application/x-cbr",
        },
      }),
    )

    const mediaFireUrl = "https://www.mediafire.com/file/cache123/comic.cbr/file"

    const firstResponse = await app.handle(
      new Request(`http://localhost/api/proxy/download?url=${encodeURIComponent(mediaFireUrl)}`),
    )
    const secondResponse = await app.handle(
      new Request(`http://localhost/api/proxy/download?url=${encodeURIComponent(mediaFireUrl)}`),
    )

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(fetchCalls.map((call) => call.url)).toEqual([
      mediaFireUrl,
      "https://download1501.mediafire.com/xyz/comic.cbr",
      "https://download1501.mediafire.com/xyz/comic.cbr",
    ])
    expect(await firstResponse.text()).toBe("first-mediafire-file")
    expect(await secondResponse.text()).toBe("cached-mediafire-file")
  })

  it("falls back to a direct fetch for other providers", async () => {
    queuedResponses.push(
      new Response("generic-file", {
        headers: {
          "content-type": "application/octet-stream",
        },
      }),
    )

    const directUrl = "https://example.com/files/comic.cbr"
    const response = await app.handle(
      new Request(`http://localhost/api/proxy/download?url=${encodeURIComponent(directUrl)}`),
    )

    expect(response.status).toBe(200)
    expect(fetchCalls.map((call) => call.url)).toEqual([directUrl])
    expect(response.headers.get("content-type")).toBe("application/octet-stream")
    expect(await response.text()).toBe("generic-file")
  })

  it("resolves MEGA files for online reading and download", async () => {
    queuedMegaFiles.push({
      directory: false,
      name: "absolute-batman.cbr",
      size: 9,
      loadAttributes: async () => undefined,
      download: () => Readable.from(["mega-file"]),
    })

    const megaUrl = "https://mega.nz/file/abc123#secret-key"
    const response = await app.handle(
      new Request(`http://localhost/api/proxy/download?url=${encodeURIComponent(megaUrl)}`),
    )

    expect(response.status).toBe(200)
    expect(megaFromUrlCalls).toEqual([megaUrl])
    expect(fetchCalls).toHaveLength(0)
    expect(response.headers.get("content-type")).toBe("application/x-cbr")
    expect(response.headers.get("content-length")).toBe("9")
    expect(response.headers.get("content-disposition")).toContain('filename="absolute-batman.cbr"')
    expect(await response.text()).toBe("mega-file")
  })
})
