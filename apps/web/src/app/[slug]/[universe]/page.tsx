import type { Metadata } from "next"
import { cookies } from "next/headers"

import { AUTH_COOKIE_KEY } from "@/components/header/auth.cookie"
import { getServerAuthUser } from "@/components/header/auth.server"
import { getCharacterImages } from "@/constants/character-images"
import { SITE_DESCRIPTION } from "@/lib/seo"
import { deduplicateById } from "@/utils/deduplicate-by-id"
import { getComicUniverseLabel } from "@dc-absoluto/shared-types"
import { CharacterPageContent } from "../character-page-content"
import { getCharacterComics, getReadComicsByCharacter } from "../character-page.data"

interface CharacterUniversePageProps {
  params: Promise<{ slug: string; universe: string }>
}

export async function generateMetadata({
  params,
}: CharacterUniversePageProps): Promise<Metadata> {
  const { slug, universe } = await params
  const result = await getCharacterComics(slug, universe)
  const theme = getCharacterImages(slug)
  const characterName = result?.character?.name
  const universeLabel = getComicUniverseLabel(universe)

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

  const description = `Explore as HQs de ${characterName} no universo ${universeLabel} da DC. Veja edições, capas e downloads em português.`

  return {
    title: `${characterName} | ${universeLabel}`,
    description,
    alternates: {
      canonical: `/${slug}/${universe}`,
    },
    openGraph: {
      title: `${characterName} | ${universeLabel}`,
      description,
      url: `/${slug}/${universe}`,
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
      title: `${characterName} | ${universeLabel}`,
      description,
      images: [theme.image],
    },
  }
}

export default async function CharacterUniversePage({ params }: CharacterUniversePageProps) {
  const { slug, universe } = await params
  const result = await getCharacterComics(slug, universe)
  const characterTheme = getCharacterImages(slug)
  const authUser = await getServerAuthUser()
  const cookieStore = await cookies()
  const authCookieValue = cookieStore.get(AUTH_COOKIE_KEY)?.value
  const readComics = authUser ? await getReadComicsByCharacter(slug, authCookieValue) : []

  if (!result || !result.data) {
    return (
      <CharacterPageContent
        slug={slug}
        universe={universe}
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
      universe={universe}
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
