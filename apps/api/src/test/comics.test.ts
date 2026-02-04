import { describe, expect, it } from "bun:test"
import { createApp } from "../index"

describe("Comics endpoints", () => {
  const app = createApp()

  describe("GET /api/comics/:id", () => {
    it("returns 404 when comic is not found", async () => {
      const id = "123e4567-e89b-12d3-a456-426614174000"
      const response = await app.handle(new Request(`http://localhost/api/comics/${id}`))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body).toHaveProperty("message")
      expect(body.message).toBe("HQ não encontrada")
    })
  })
})
