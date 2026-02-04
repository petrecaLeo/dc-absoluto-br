import type { Character } from "@dc-absoluto/shared-types"

const SERVER_API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const CACHE_REVALIDATE_SECONDS = 60 * 60 * 24 * 7 // 1 semana
const MAX_RETRIES = 1
const RETRY_DELAY_MS = 1000

export interface CharactersResponse {
  data: Character[]
  total: number
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) {
        return response
      }
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }

    if (attempt < retries) {
      await delay(RETRY_DELAY_MS * (attempt + 1))
    }
  }

  throw lastError
}

export async function getCharacters(): Promise<CharactersResponse> {
  const response = await fetchWithRetry(`${SERVER_API_URL}/api/characters`, {
    next: { revalidate: CACHE_REVALIDATE_SECONDS },
  })

  return response.json()
}

export async function getCharactersClient(): Promise<CharactersResponse> {
  const response = await fetch(`${CLIENT_API_URL}/api/characters`)

  if (!response.ok) {
    throw new Error(`Failed to fetch characters: ${response.status}`)
  }

  return response.json()
}
