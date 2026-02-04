import { useMemo, useState } from "react"

import type { Comic } from "@dc-absoluto/shared-types"

export type SortOrder = "oldest" | "newest"
export type EditionFilter = "all" | "special"

function isSpecialEdition(comic: Comic): boolean {
  if (comic.issueNumber === undefined) return false
  return !Number.isInteger(comic.issueNumber)
}

export function useComicsFilter(comics: Comic[]) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest")
  const [editionFilter, setEditionFilter] = useState<EditionFilter>("all")

  const hasSpecialEditions = useMemo(() => {
    return comics.some(isSpecialEdition)
  }, [comics])

  const filteredAndSortedComics = useMemo(() => {
    let result = [...comics]

    if (editionFilter === "special") {
      result = result.filter(isSpecialEdition)
    }

    return result.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0

      return sortOrder === "oldest" ? dateA - dateB : dateB - dateA
    })
  }, [comics, sortOrder, editionFilter])

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "oldest" ? "newest" : "oldest"))
  }

  function toggleEditionFilter() {
    setEditionFilter((prev) => (prev === "all" ? "special" : "all"))
  }

  return {
    sortOrder,
    editionFilter,
    hasSpecialEditions,
    sortedComics: filteredAndSortedComics,
    toggleSortOrder,
    toggleEditionFilter,
    setSortOrder,
    setEditionFilter,
  }
}
