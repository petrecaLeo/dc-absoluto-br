import type { Metadata } from "next"

import { getServerAuthUser, getSessionToken } from "@/components/header/auth.server"
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
      images: theme.image ? [{ url: theme.image, alt: characterName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${characterName} | ${universeLabel}`,
      description,
      images: theme.image ? [theme.image] : undefined,
    },
  }
}

export default async function CharacterUniversePage({ params }: CharacterUniversePageProps) {
  const { slug, universe } = await params
  const result = await getCharacterComics(slug, universe)
  const characterTheme = getCharacterImages(slug)
  const authUser = await getServerAuthUser()
  const readComics = authUser ? await getReadComicsByCharacter(slug, await getSessionToken()) : []

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
