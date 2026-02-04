import { describe, expect, it } from "vitest"
import {
  characterSchema,
  comicSchema,
  createCharacterSchema,
  createComicSchema,
  newsletterSubscribeSchema,
  paginationSchema,
} from "./index"

describe("Comic schemas", () => {
  describe("comicSchema", () => {
    it("validates a complete comic", () => {
      const comic = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Absolute Batman #1",
        titleOriginal: "Absolute Batman #1",
        issueNumber: 1,
        description: "A new take on Batman",
        coverUrl: "https://example.com/cover.jpg",
        releaseDate: new Date(),
        releaseDateBr: new Date(),
        publisher: "DC Comics",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => comicSchema.parse(comic)).not.toThrow()
    })

    it("rejects invalid UUID", () => {
      const comic = {
        id: "invalid-uuid",
        title: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => comicSchema.parse(comic)).toThrow()
    })
  })

  describe("createComicSchema", () => {
    it("validates comic creation without id", () => {
      const input = {
        title: "Absolute Superman #1",
        issueNumber: 1,
      }

      expect(() => createComicSchema.parse(input)).not.toThrow()
    })

    it("rejects empty title", () => {
      const input = {
        title: "",
      }

      expect(() => createComicSchema.parse(input)).toThrow()
    })
  })
})

describe("Character schemas", () => {
  describe("characterSchema", () => {
    it("validates a complete character", () => {
      const character = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Bruce Wayne",
        alias: "Batman",
        description: "The Dark Knight",
        imageUrl: "https://example.com/batman.jpg",
        isHero: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => characterSchema.parse(character)).not.toThrow()
    })
  })

  describe("createCharacterSchema", () => {
    it("validates character creation", () => {
      const input = {
        name: "Clark Kent",
        alias: "Superman",
        isHero: true,
      }

      expect(() => createCharacterSchema.parse(input)).not.toThrow()
    })
  })
})

describe("Newsletter schema", () => {
  it("validates correct email", () => {
    expect(() => newsletterSubscribeSchema.parse({ email: "test@example.com" })).not.toThrow()
  })

  it("rejects invalid email", () => {
    expect(() => newsletterSubscribeSchema.parse({ email: "invalid" })).toThrow()
  })
})

describe("Pagination schema", () => {
  it("uses defaults when not provided", () => {
    const result = paginationSchema.parse({})

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it("coerces string numbers", () => {
    const result = paginationSchema.parse({ page: "2", pageSize: "50" })

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(50)
  })

  it("rejects pageSize over 100", () => {
    expect(() => paginationSchema.parse({ pageSize: 200 })).toThrow()
  })
})
