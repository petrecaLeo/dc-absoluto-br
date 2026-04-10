import { useMemo, useState } from "react"

import type { Comic } from "@dc-absoluto/shared-types"

export type SortOrder = "initial" | "oldest" | "newest"
export type EditionFilter = "all" | "special"

function isSpecialEdition(comic: Comic): boolean {
  if (comic.issueNumber === undefined) return false
  return !Number.isInteger(comic.issueNumber)
}

function getIssueNumberSortValue(comic: Comic) {
  return typeof comic.issueNumber === "number" && Number.isFinite(comic.issueNumber)
    ? comic.issueNumber
    : Number.POSITIVE_INFINITY
}

function getReleaseDateSortValue(comic: Comic) {
  return comic.releaseDate ? new Date(comic.releaseDate).getTime() : 0
}

export function useComicsFilter(comics: Comic[]) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("initial")
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
      if (sortOrder === "initial") {
        const issueNumberDifference = getIssueNumberSortValue(a) - getIssueNumberSortValue(b)
        if (issueNumberDifference !== 0) {
          return issueNumberDifference
        }

        const dateDifference = getReleaseDateSortValue(a) - getReleaseDateSortValue(b)
        if (dateDifference !== 0) {
          return dateDifference
        }

        return a.title.localeCompare(b.title, "pt-BR")
      }

      const dateA = getReleaseDateSortValue(a)
      const dateB = getReleaseDateSortValue(b)

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
