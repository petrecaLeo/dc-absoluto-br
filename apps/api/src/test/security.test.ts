import { describe, expect, it, spyOn } from "bun:test"
import { PgDialect } from "drizzle-orm/pg-core"
import { users } from "../db/schema"
import { createApp, getAllowedOrigins } from "../index"
import { escapeHtml } from "../services/email"
import { hashEmailToken, matchesEmailToken } from "../utils/email-token"

describe("Segurança da API", () => {
  const app = createApp()

  describe("CORS", () => {
    it("libera o site configurado e as origens de desenvolvimento", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/characters", {
          headers: { origin: "http://localhost:3000" },
        }),
      )

      expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000")
      expect(response.headers.get("access-control-allow-credentials")).toBeNull()
    })

    it("não libera outros sites", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/characters", {
          headers: { origin: "https://site-malicioso.com" },
        }),
      )

      expect(response.headers.get("access-control-allow-origin")).toBeNull()
    })

    it("monta a lista a partir do SITE_URL, com e sem www", () => {
      expect(
        getAllowedOrigins({ NODE_ENV: "production", SITE_URL: "https://dc-absoluto-br.com.br/" }),
      ).toEqual(["https://dc-absoluto-br.com.br", "https://www.dc-absoluto-br.com.br"])
    })

    it("CORS_ORIGINS substitui a lista padrão", () => {
      expect(
        getAllowedOrigins({
          NODE_ENV: "production",
          SITE_URL: "https://dc-absoluto-br.com.br",
          CORS_ORIGINS: "https://a.com.br, https://b.com.br/",
        }),
      ).toEqual(["https://a.com.br", "https://b.com.br"])
    })
  })

  it("envia headers de segurança", async () => {
    const response = await app.handle(new Request("http://localhost/health"))

    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
    expect(response.headers.get("x-frame-options")).toBe("DENY")
    expect(response.headers.get("referrer-policy")).toBe("no-referrer")
  })

  it("não vaza a mensagem de erros inesperados", async () => {
    const errorSpy = spyOn(console, "error").mockImplementation(() => {})
    const appWithBug = createApp().get("/boom", () => {
      throw new Error("detalhe interno do banco")
    })

    const response = await appWithBug.handle(new Request("http://localhost/boom"))
    const body = await response.text()

    expect(response.status).toBe(500)
    expect(body).not.toContain("detalhe interno")
    errorSpy.mockRestore()
  })

  it("recusa ids que não são UUID antes de chegar ao banco", async () => {
    const comic = await app.handle(new Request("http://localhost/api/comics/1%20or%201=1"))
    const profile = await app.handle(new Request("http://localhost/api/users/abc/profile"))

    expect(comic.status).toBe(422)
    expect(profile.status).toBe(422)
  })

  it("escapa HTML vindo de usuário nos e-mails", () => {
    expect(escapeHtml("<a href=\"https://phishing.com\">Clique</a> & 'oi'")).toBe(
      "&lt;a href=&quot;https://phishing.com&quot;&gt;Clique&lt;/a&gt; &amp; &#39;oi&#39;",
    )
  })

  it("guarda tokens de e-mail só como hash", () => {
    const token = "4b3c1f62-6d1e-4a8e-9a3a-0f2f7d5c9e11"

    expect(hashEmailToken(token)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashEmailToken(token)).not.toContain(token)
    expect(hashEmailToken(token)).toBe(hashEmailToken(token))
  })

  it("não aceita o hash do banco como se fosse o token", () => {
    const storedHash = hashEmailToken("4b3c1f62-6d1e-4a8e-9a3a-0f2f7d5c9e11")
    const dialect = new PgDialect()
    const query = (token: string) =>
      dialect.sqlToQuery(matchesEmailToken(users.passwordHash, token)!)

    // Hash enviado como token: só compara o hash do hash, nunca o valor cru.
    expect(query(storedHash).params).toEqual([hashEmailToken(storedHash)])
    // UUID (links antigos): compara o hash e, por compatibilidade, o valor cru.
    expect(query("4b3c1f62-6d1e-4a8e-9a3a-0f2f7d5c9e11").params).toHaveLength(2)
  })
})
