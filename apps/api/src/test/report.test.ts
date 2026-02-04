import { describe, expect, it } from "bun:test"
import { createApp } from "../index"

describe("Report endpoints", () => {
  const app = createApp()

  describe("POST /api/report/send", () => {
    it("accepts valid report message", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/report/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "O link está quebrado" }),
        }),
      )
      const body = await response.json()

      expect(body.message).toBeDefined()
    })

    it("rejects empty message", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/report/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "" }),
        }),
      )

      expect(response.status).toBe(422)
    })

    it("rejects missing message field", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/report/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      )

      expect(response.status).toBe(422)
    })
  })
})
