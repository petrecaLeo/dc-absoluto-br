import type { Metadata } from "next"
import { cache } from "react"
import { cookies } from "next/headers"

import { AUTH_COOKIE_KEY } from "@/components/header/auth.cookie"
import { getServerAuthUser } from "@/components/header/auth.server"
import { getCharacterImages } from "@/constants/character-images"
import { SITE_DESCRIPTION } from "@/lib/seo"
import { deduplicateById } from "@/utils/deduplicate-by-id"
import type { Character, Comic } from "@dc-absoluto/shared-types"
import { CharacterPageContent } from "./character-page-content"
import { SERVER_API_URL } from "@/lib/env/server"

interface CharacterComicsResponse {
  data: Comic[] | null
  character: Character
  total: number
  message?: string
}

interface ReadComicEntry {
  comicId: string
  readAt: string
}

export const revalidate = 180

interface CharacterPageProps {
  params: Promise<{ slug: string }>
}

const getCharacterComics = cache(async (slug: string): Promise<CharacterComicsResponse | null> => {
  try {
    const response = await fetch(`${SERVER_API_URL}/api/characters/${slug}/comics`, {
      next: { revalidate },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
})

async function getReadComicsByCharacter(
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

export async function generateMetadata({ params }: CharacterPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getCharacterComics(slug)
  const theme = getCharacterImages(slug)
  const characterName = result?.character?.name

  if (!characterName) {
    return {
      title: "Personagem nao encontrado",
      description: SITE_DESCRIPTION,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = `Explore as HQs de ${characterName} no Universo Absolute da DC. Veja edicoes, capas e downloads em portugues.`

  return {
    title: characterName,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: characterName,
      description,
      url: `/${slug}`,
      type: "website",
      images: [
        {
          url: theme.image,
          alt: characterName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: characterName,
      description,
      images: [theme.image],
    },
  }
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { slug } = await params
  const result = await getCharacterComics(slug)
  const characterTheme = getCharacterImages(slug)
  const authUser = await getServerAuthUser()
  const cookieStore = await cookies()
  const authCookieValue = cookieStore.get(AUTH_COOKIE_KEY)?.value
  const readComics = authUser
    ? await getReadComicsByCharacter(slug, authCookieValue)
    : []

  if (!result || !result.data) {
    return (
      <CharacterPageContent
        slug={slug}
        character={null}
        comics={[]}
        total={0}
        theme={characterTheme}
        hasError={!result}
        authUser={authUser}
        readComics={readComics}
      />
    )
  }

  const { character, data: comics } = result
  const uniqueComics = deduplicateById(comics)

  return (
    <CharacterPageContent
      slug={slug}
      character={character}
      comics={uniqueComics}
      total={uniqueComics.length}
      theme={characterTheme}
      hasError={false}
      authUser={authUser}
      readComics={readComics}
    />
  )
}
