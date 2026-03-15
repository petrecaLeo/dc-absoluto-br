export const DEFAULT_COMIC_UNIVERSE = "absolute"

export const COMIC_UNIVERSE_LABELS: Record<string, string> = {
  [DEFAULT_COMIC_UNIVERSE]: "Absolute",
}

export interface UniversePreviewComic {
  id: string
  title: string
  coverUrl?: string | null
  releaseDate?: Date | string | null
}

export interface CharacterUniverseSummary {
  universe: string
  label: string
  total: number
  latestComic: UniversePreviewComic | null
}

export function getComicUniverseLabel(universe?: string | null): string {
  if (!universe) return COMIC_UNIVERSE_LABELS[DEFAULT_COMIC_UNIVERSE] ?? "Absolute"

  const normalized = universe.trim().toLowerCase()
  if (!normalized) return COMIC_UNIVERSE_LABELS[DEFAULT_COMIC_UNIVERSE] ?? "Absolute"

  return (
    COMIC_UNIVERSE_LABELS[normalized] ??
    normalized
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}
