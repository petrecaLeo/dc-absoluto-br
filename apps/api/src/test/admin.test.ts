import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { createApp } from "../index"
import { createAdminSessionToken, createUserSessionToken } from "../utils/auth"

const ADMIN_EMAIL = "admin@dcabsoluto.test"

const adminUser = {
  id: "90df6742-054a-4af4-a32d-748a54b095d9",
  name: "Admin",
  email: ADMIN_EMAIL,
  profileImage: null,
  createdAt: null,
}

const validComic = {
  title: "Mulher-Gato Absoluta #1",
  issueNumber: 1,
  releaseDate: "2026-06-10",
  downloadUrl: "https://example.com/mulher-gato-1.cbr",
  characterId: "8552b2fd-cafc-4d6e-bf52-e91b37d74f25",
}

function postComic(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/comics", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
}

describe("Área administrativa", () => {
  const app = createApp()
  const previousAdminEmail = process.env.ADMIN_EMAIL

  beforeAll(() => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL
  })

  afterAll(() => {
    process.env.ADMIN_EMAIL = previousAdminEmail
  })

  describe("POST /api/comics", () => {
    it("recusa cadastro sem autenticação", async () => {
      const response = await app.handle(postComic(validComic))

      expect(response.status).toBe(401)
    })

    it("recusa sessão comum de usuário, mesmo com o e-mail do admin", async () => {
      const token = await createUserSessionToken(adminUser)
      const response = await app.handle(postComic(validComic, { authorization: `Bearer ${token}` }))

      expect(response.status).toBe(401)
    })

    it("recusa sessão de admin emitida para outro e-mail", async () => {
      const token = await createAdminSessionToken({ ...adminUser, email: "intruso@exemplo.com" })
      const response = await app.handle(postComic(validComic, { authorization: `Bearer ${token}` }))

      expect(response.status).toBe(401)
    })

    it("aceita sessão de admin válida (sem banco responde 503)", async () => {
      const token = await createAdminSessionToken(adminUser)
      const response = await app.handle(
        postComic(validComic, { cookie: `dcabsoluto.admin=${token}` }),
      )

      expect(response.status).toBe(503)
    })

    it("exige link de download, número, data e personagem", async () => {
      const token = await createAdminSessionToken(adminUser)

      for (const field of ["downloadUrl", "issueNumber", "releaseDate", "characterId"] as const) {
        const { [field]: _omitted, ...body } = validComic
        const response = await app.handle(postComic(body, { authorization: `Bearer ${token}` }))

        expect(response.status).toBe(422)
      }
    })
  })

  describe("POST /api/admin/login", () => {
    it("fica indisponível quando ADMIN_EMAIL não está configurado", async () => {
      process.env.ADMIN_EMAIL = ""
      const response = await app.handle(
        new Request("http://localhost/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: ADMIN_EMAIL, password: "Senha123" }),
        }),
      )
      process.env.ADMIN_EMAIL = ADMIN_EMAIL

      expect(response.status).toBe(503)
    })
  })
})
