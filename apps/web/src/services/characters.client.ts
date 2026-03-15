import { PUBLIC_API_URL } from "@/lib/env/public"
import type { Character, CharacterUniverseSummary, Comic } from "@dc-absoluto/shared-types"

export interface CharactersResponse {
  data: Character[]
  total: number
}

export interface CharacterComicsResponse {
  data: Comic[]
  character: Character
  universe: {
    slug: string
    label: string
  } | null
  total: number
}

export interface CharacterUniversesResponse {
  data: CharacterUniverseSummary[]
  character: Character
  total: number
}

export async function getCharactersClient(): Promise<CharactersResponse> {
  const response = await fetch(`${PUBLIC_API_URL}/api/characters`)

  if (!response.ok) {
    throw new Error(`Failed to fetch characters: ${response.status}`)
  }

  return response.json()
}

export async function getCharacterComicsClient(
  slug: string,
  universe?: string,
): Promise<CharacterComicsResponse> {
  const searchParams = new URLSearchParams()
  if (universe) {
    searchParams.set("universe", universe)
  }

  const url = `${PUBLIC_API_URL}/api/characters/${slug}/comics${
    searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  }`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch character comics: ${response.status}`)
  }

  return response.json()
}

export async function getCharacterUniversesClient(slug: string): Promise<CharacterUniversesResponse> {
  const response = await fetch(`${PUBLIC_API_URL}/api/characters/${slug}/universes`)

  if (!response.ok) {
    throw new Error(`Failed to fetch character universes: ${response.status}`)
  }

  return response.json()
}
