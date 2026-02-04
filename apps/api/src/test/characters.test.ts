import { describe, expect, it } from "bun:test"
import { createApp } from "../index"

describe("Characters endpoints", () => {
  const app = createApp()

  describe("GET /api/characters", () => {
    it("returns array with correct structure", async () => {
      const response = await app.handle(new Request("http://localhost/api/characters"))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(body.data)).toBe(true)
      expect(typeof body.total).toBe("number")
      expect(body.total).toBe(body.data.length)
    })

    it("returns characters with required fields", async () => {
      const response = await app.handle(new Request("http://localhost/api/characters"))
      const body = await response.json()

      if (body.data.length > 0) {
        const character = body.data[0]
        expect(character).toHaveProperty("id")
        expect(character).toHaveProperty("name")
        expect(character).toHaveProperty("slug")
        expect(character).toHaveProperty("createdAt")
        expect(character).toHaveProperty("updatedAt")
      }
    })
  })

  describe("GET /api/characters/:slug/comics", () => {
    it("returns 404 for non-existent character", async () => {
      const slug = "personagem-inexistente"
      const response = await app.handle(
        new Request(`http://localhost/api/characters/${slug}/comics`),
      )
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.message).toBe("Personagem não encontrado")
    })

    it("returns comics array for existing character", async () => {
      const charactersResponse = await app.handle(new Request("http://localhost/api/characters"))
      const charactersBody = await charactersResponse.json()

      if (charactersBody.data.length > 0) {
        const characterSlug = charactersBody.data[0].slug
        const response = await app.handle(
          new Request(`http://localhost/api/characters/${characterSlug}/comics`),
        )
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(Array.isArray(body.data)).toBe(true)
        expect(body).toHaveProperty("character")
        expect(body).toHaveProperty("total")
      }
    })
  })
})
