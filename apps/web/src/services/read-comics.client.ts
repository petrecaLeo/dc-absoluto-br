export interface ReadComicsCountResponse {
  data: {
    count: number
  }
}

export interface TopCharacter {
  characterId: string
  characterName: string
  count: number
}

export interface TopCharactersResponse {
  data: TopCharacter[]
  userCreatedAt: string | null
}

export interface ReadComicsByCharacterResponse {
  data: {
    comicId: string
    readAt: string
  }[]
}

export async function getReadComicsCount(): Promise<ReadComicsCountResponse> {
  const response = await fetch("/api/comics/read/count", { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`Failed to fetch read comics count: ${response.status}`)
  }

  return response.json()
}

export async function getTopCharacters(): Promise<TopCharactersResponse> {
  const response = await fetch("/api/comics/read/top-characters", { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`Failed to fetch top characters: ${response.status}`)
  }

  return response.json()
}

export async function getReadComicsByCharacter(
  slug: string,
): Promise<ReadComicsByCharacterResponse> {
  const response = await fetch(`/api/characters/${slug}/comics/read`, { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`Failed to fetch read comics for ${slug}: ${response.status}`)
  }

  return response.json()
}
