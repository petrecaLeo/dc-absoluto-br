import type { Character, Comic } from "@dc-absoluto/shared-types"
import { PUBLIC_API_URL } from "@/lib/env/public"

export interface CharactersResponse {
  data: Character[]
  total: number
}

export interface CharacterComicsResponse {
  data: Comic[]
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

export async function getCharacterComicsClient(slug: string): Promise<CharacterComicsResponse> {
  const response = await fetch(`${PUBLIC_API_URL}/api/characters/${slug}/comics`)

  if (!response.ok) {
    throw new Error(`Failed to fetch character comics: ${response.status}`)
  }

  return response.json()
}
