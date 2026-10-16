import {
  ADMIN_SESSION_COOKIE_KEY,
  ADMIN_SESSION_TTL_SECONDS,
  type SessionScope,
  createSessionToken,
} from "@dc-absoluto/shared-types/session-token"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST as adminLoginRoute } from "@/app/api/admin/login/route"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

const OTHER_SECRET = "outro-segredo-com-mais-de-trinta-e-dois-caracteres"

function signToken(scope: SessionScope, secret = process.env.AUTH_SECRET as string) {
  return createSessionToken(
    {
      scope,
      sub: "90df6742-054a-4af4-a32d-748a54b095d9",
      email: "admin@exemplo.com",
      name: "Admin",
      profileImage: null,
      createdAt: null,
    },
    secret,
    ADMIN_SESSION_TTL_SECONDS,
  )
}

function adminLogin(headers: Record<string, string> = {}) {
  return adminLoginRoute(
    new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: "admin@exemplo.com", password: "Senha123" }),
    }),
  )
}

describe("POST /api/admin/login (web)", () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("guarda em cookie o token válido e não o devolve ao navegador", async () => {
    const token = await signToken("admin")
    mockFetch.mockResolvedValue(Response.json({ success: true, token, expiresIn: 1800 }))

    const response = await adminLogin()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, expiresIn: 1800 })
    expect(response.headers.get("set-cookie")).toContain(`${ADMIN_SESSION_COOKIE_KEY}=${token}`)
  })

  it("recusa token assinado com outro AUTH_SECRET em vez de fingir que logou", async () => {
    const token = await signToken("admin", OTHER_SECRET)
    mockFetch.mockResolvedValue(Response.json({ success: true, token }))

    const response = await adminLogin()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.success).toBe(false)
    expect(body.message).toMatch(/AUTH_SECRET/)
    expect(body.token).toBeUndefined()
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("recusa token de usuário comum quando espera sessão de admin", async () => {
    const token = await signToken("user")
    mockFetch.mockResolvedValue(Response.json({ success: true, token }))

    const response = await adminLogin()

    expect(response.status).toBe(502)
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("aceita requisições vindas do próprio site", async () => {
    const token = await signToken("admin")
    mockFetch.mockResolvedValue(Response.json({ success: true, token, expiresIn: 1800 }))

    const response = await adminLogin({
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "sec-fetch-site": "same-origin",
    })

    expect(response.status).toBe(200)
  })

  it("recusa requisições disparadas por outro site (CSRF)", async () => {
    const crossSiteHeaders = [
      { origin: "https://site-malicioso.com", host: "localhost:3000" },
      { origin: "null", host: "localhost:3000" },
      { "sec-fetch-site": "cross-site", host: "localhost:3000" },
      { "sec-fetch-site": "same-site", origin: "https://api.localhost:3000" },
    ]

    for (const headers of crossSiteHeaders) {
      const response = await adminLogin(headers)
      expect(response.status).toBe(403)
    }

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
