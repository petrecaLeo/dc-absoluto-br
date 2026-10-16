import { describe, expect, it } from "bun:test"
import { verifySessionToken } from "@dc-absoluto/shared-types/session-token"
import { createApp } from "../index"
import { createUserSessionToken, getAuthSecret } from "../utils/auth"
import { createAttemptLimiter } from "../utils/rate-limit"

const user = {
  id: "8552b2fd-cafc-4d6e-bf52-e91b37d74f25",
  name: "Bruce Wayne",
  email: "bruce@wayne.com",
  profileImage: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}

function postJson(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
}

describe("Sessão de usuário", () => {
  const app = createApp()

  it("rejeita o cookie antigo em JSON sem assinatura", async () => {
    const forged = encodeURIComponent(JSON.stringify(user))
    const response = await app.handle(
      postJson(
        "/api/auth/profile-name",
        { name: "Coringa" },
        { cookie: `dcabsoluto.auth=${forged}` },
      ),
    )

    expect(response.status).toBe(401)
  })

  it("rejeita um cookie de sessão adulterado", async () => {
    const token = await createUserSessionToken(user)
    const [version, , signature] = token.split(".")
    const forgedPayload = Buffer.from(
      JSON.stringify({ scope: "user", ...user, sub: user.id, email: "outra@pessoa.com" }),
    ).toString("base64url")

    const response = await app.handle(
      postJson(
        "/api/auth/profile-name",
        { name: "Coringa" },
        { cookie: `dcabsoluto.session=${version}.${forgedPayload}.${signature}` },
      ),
    )

    expect(response.status).toBe(401)
  })

  it("aceita a sessão assinada via cookie e devolve um token renovado com o novo nome", async () => {
    const token = await createUserSessionToken(user)
    const response = await app.handle(
      postJson(
        "/api/auth/profile-name",
        { name: "Batman" },
        { cookie: `dcabsoluto.session=${token}` },
      ),
    )
    const body = (await response.json()) as { user: { name: string }; token: string }

    expect(response.status).toBe(200)
    expect(body.user.name).toBe("Batman")

    const renewed = await verifySessionToken(body.token, getAuthSecret(), "user")
    expect(renewed?.name).toBe("Batman")
    expect(renewed?.email).toBe(user.email)
  })

  it("aceita a sessão assinada via Authorization Bearer", async () => {
    const token = await createUserSessionToken(user)
    const response = await app.handle(
      postJson(
        "/api/auth/profile-image",
        { profileImage: "batman" },
        { authorization: `Bearer ${token}` },
      ),
    )

    expect(response.status).toBe(200)
  })

  it("o login devolve um token de sessão válido", async () => {
    const response = await app.handle(
      postJson("/api/auth/login", { email: "Bruce@Wayne.com", password: "Senha123" }),
    )
    const body = (await response.json()) as { token: string }

    expect(response.status).toBe(200)
    const claims = await verifySessionToken(body.token, getAuthSecret(), "user")
    expect(claims?.email).toBe("bruce@wayne.com")
  })
})

describe("Limitador de tentativas", () => {
  it("bloqueia após o limite e libera quando a janela expira", () => {
    const limiter = createAttemptLimiter({ maxAttempts: 2, windowMs: 1000 })

    limiter.registerFailure("a", 0)
    expect(limiter.isBlocked("a", 0)).toBe(false)
    limiter.registerFailure("a", 10)
    expect(limiter.isBlocked("a", 10)).toBe(true)
    expect(limiter.isBlocked("b", 10)).toBe(false)
    expect(limiter.isBlocked("a", 1001)).toBe(false)
  })

  it("zera as falhas após um acerto", () => {
    const limiter = createAttemptLimiter({ maxAttempts: 1, windowMs: 1000 })

    limiter.registerFailure("a", 0)
    limiter.reset("a")
    expect(limiter.isBlocked("a", 0)).toBe(false)
  })

  it("consume conta toda chamada e recusa depois do limite", () => {
    const limiter = createAttemptLimiter({ maxAttempts: 2, windowMs: 1000 })

    expect(limiter.consume("a", 0)).toBe(true)
    expect(limiter.consume("a", 1)).toBe(true)
    expect(limiter.consume("a", 2)).toBe(false)
    expect(limiter.consume("b", 2)).toBe(true)
    expect(limiter.consume("a", 1001)).toBe(true)
  })
})
