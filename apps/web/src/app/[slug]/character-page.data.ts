import { cache } from "react"

import { AUTH_COOKIE_KEY } from "@/components/header/auth.cookie"
import { SERVER_API_URL } from "@/lib/env/server"
import type { Character, CharacterUniverseSummary, Comic } from "@dc-absoluto/shared-types"

export const characterPageRevalidate = 180

export interface CharacterComicsResponse {
  data: Comic[] | null
  character: Character
  universe: {
    slug: string
    label: string
  } | null
  total: number
  message?: string
}

export interface CharacterUniversesResponse {
  data: CharacterUniverseSummary[] | null
  character: Character
  total: number
  message?: string
}

export interface ReadComicEntry {
  comicId: string
  readAt: string
}

export const getCharacterComics = cache(
  async (slug: string, universe: string): Promise<CharacterComicsResponse | null> => {
    const searchParams = new URLSearchParams({ universe })

    try {
      const response = await fetch(
        `${SERVER_API_URL}/api/characters/${slug}/comics?${searchParams.toString()}`,
        {
          next: { revalidate: characterPageRevalidate },
        },
      )

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch {
      return null
    }
  },
)

export const getCharacterUniverses = cache(
  async (slug: string): Promise<CharacterUniversesResponse | null> => {
    try {
      const response = await fetch(`${SERVER_API_URL}/api/characters/${slug}/universes`, {
        next: { revalidate: characterPageRevalidate },
      })

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch {
      return null
    }
  },
)

export async function getReadComicsByCharacter(
  slug: string,
  authCookieValue: string | undefined,
): Promise<ReadComicEntry[]> {
  if (!authCookieValue) return []

  try {
    const response = await fetch(`${SERVER_API_URL}/api/characters/${slug}/comics/read`, {
      cache: "no-store",
      headers: {
        cookie: `${AUTH_COOKIE_KEY}=${authCookieValue}`,
      },
    })

    if (!response.ok) return []

    const payload = (await response.json()) as {
      data?: ReadComicEntry[] | null
    }
    return payload.data ?? []
  } catch {
    return []
  }
}
