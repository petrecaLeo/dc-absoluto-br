import type { Metadata } from "next"

import type { LatestComic } from "@/sections/home/latest-launch"
import { PageContent } from "./page-content"
import { SERVER_API_URL } from "@/lib/env/server"

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
}

const API_URL = SERVER_API_URL
const LATEST_COMIC_REVALIDATE_SECONDS = 60 * 60 * 24

async function getLatestComic(): Promise<LatestComic | null> {
  try {
    const response = await fetch(`${API_URL}/api/comics/latest`, {
      next: { revalidate: LATEST_COMIC_REVALIDATE_SECONDS },
    })

    if (!response.ok) return null

    const payload = (await response.json()) as { data?: LatestComic | null }
    return payload.data ?? null
  } catch {
    return null
  }
}

export default async function Page() {
  const latestComic = await getLatestComic()
  return <PageContent latestComic={latestComic} />
}
