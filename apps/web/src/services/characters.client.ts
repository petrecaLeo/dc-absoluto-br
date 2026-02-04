import type { Character } from "@dc-absoluto/shared-types"
import { PUBLIC_API_URL } from "@/lib/env/public"

export interface CharactersResponse {
  data: Character[]
  total: number
}

export async function getCharactersClient(): Promise<CharactersResponse> {
  const response = await fetch(`${PUBLIC_API_URL}/api/characters`)

  if (!response.ok) {
    throw new Error(`Failed to fetch characters: ${response.status}`)
  }

  return response.json()
}
