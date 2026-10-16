import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Comic } from "@dc-absoluto/shared-types"
import { useComicsFilter } from "./use-comics-filter"

const baseComic: Comic = {
  id: "comic-1",
  title: "Batman #1",
  universe: "absolute",
  issueNumber: 1,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
}

// A API devolve null (não undefined) para colunas vazias do banco.
const comicWithoutOptionalFields = {
  ...baseComic,
  id: "comic-2",
  title: "Batman sem número",
  issueNumber: null,
  releaseDate: null,
  coverUrl: null,
  writer: null,
  artists: null,
} as unknown as Comic

describe("useComicsFilter", () => {
  it("não trata HQ sem número como edição especial", () => {
    const { result } = renderHook(() => useComicsFilter([baseComic, comicWithoutOptionalFields]))

    expect(result.current.hasSpecialEditions).toBe(false)
  })

  it("trata número fracionado como edição especial", () => {
    const { result } = renderHook(() =>
      useComicsFilter([baseComic, { ...baseComic, id: "comic-3", issueNumber: 13.5 }]),
    )

    expect(result.current.hasSpecialEditions).toBe(true)
  })

  it("ordena HQ sem número e sem data por último, sem quebrar", () => {
    const { result } = renderHook(() => useComicsFilter([comicWithoutOptionalFields, baseComic]))

    expect(result.current.sortedComics.map((comic) => comic.id)).toEqual(["comic-1", "comic-2"])
  })
})
