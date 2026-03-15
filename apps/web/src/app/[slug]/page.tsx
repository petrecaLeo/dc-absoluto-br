import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCharacterImages } from "@/constants/character-images"
import { SITE_DESCRIPTION } from "@/lib/seo"
import { CharacterUniversesPageContent } from "./character-universes-page-content"
import { getCharacterUniverses } from "./character-page.data"

interface CharacterUniversesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: CharacterUniversesPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getCharacterUniverses(slug)
  const theme = getCharacterImages(slug)
  const characterName = result?.character?.name
  const totalUniverses = result?.data?.length ?? 0

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

  const description =
    totalUniverses > 1
      ? `Escolha entre os universos disponíveis de ${characterName} e navegue pelas HQs dessa linha específica.`
      : `Explore as HQs de ${characterName} no catálogo da DC em português.`

  return {
    title: `${characterName} | Universos`,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: `${characterName} | Universos`,
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
      title: `${characterName} | Universos`,
      description,
      images: [theme.image],
    },
  }
}

export default async function CharacterUniversesPage({ params }: CharacterUniversesPageProps) {
  const { slug } = await params
  const result = await getCharacterUniverses(slug)
  const characterTheme = getCharacterImages(slug)
  const firstUniverse = result?.data?.[0]

  if (result?.data?.length === 1 && firstUniverse) {
    redirect(`/${slug}/${firstUniverse.universe}`)
  }

  return (
    <CharacterUniversesPageContent
      slug={slug}
      character={result?.character ?? null}
      universes={result?.data ?? []}
      theme={characterTheme}
      hasError={!result}
    />
  )
}
