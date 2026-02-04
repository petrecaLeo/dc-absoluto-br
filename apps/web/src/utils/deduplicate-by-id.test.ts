import { describe, expect, it } from "vitest"
import { deduplicateById } from "./deduplicate-by-id"

describe("deduplicateById", () => {
  it("remove itens com ids duplicados mantendo a primeira ocorrencia", () => {
    const items = [
      { id: "1", title: "Item A" },
      { id: "2", title: "Item B" },
      { id: "1", title: "Item A duplicado" },
    ]

    const result = deduplicateById(items)

    expect(result).toEqual([
      { id: "1", title: "Item A" },
      { id: "2", title: "Item B" },
    ])
  })

  it("retorna array vazio quando recebe array vazio", () => {
    expect(deduplicateById([])).toEqual([])
  })

  it("retorna o mesmo array quando nao ha duplicatas", () => {
    const items = [
      { id: "1", title: "A" },
      { id: "2", title: "B" },
      { id: "3", title: "C" },
    ]

    expect(deduplicateById(items)).toEqual(items)
  })
})
