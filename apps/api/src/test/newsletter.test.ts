import { describe, expect, it } from "bun:test"
import { createApp } from "../index"

describe("Newsletter endpoints", () => {
  const app = createApp()

  describe("POST /api/newsletter/subscribe", () => {
    it("subscribes valid email", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "teste@exemplo.com" }),
        }),
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.message).toContain("teste@exemplo.com")
    })

    it("rejects invalid email", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "invalid-email" }),
        }),
      )

      expect(response.status).toBe(422)
    })
  })
})
