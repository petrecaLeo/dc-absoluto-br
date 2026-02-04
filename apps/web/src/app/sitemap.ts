import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/seo"
import { getCharacters } from "@/services/characters"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]

  try {
    const { data: characters } = await getCharacters()

    for (const character of characters) {
      entries.push({
        url: `${siteUrl}/${character.slug}`,
        lastModified: character.updatedAt ? new Date(character.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  } catch {
    return entries
  }

  return entries
}
