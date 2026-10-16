import { ComicReader } from "@/components/comic-reader"
import { SERVER_API_URL } from "@/lib/env/server"
import type { Comic } from "@dc-absoluto/shared-types"

// "from" volta para a página do personagem (ex.: "batman/absolute"). Qualquer outra coisa cai na home,
// para que "?from=/site-malicioso.com" não vire um link "//site-malicioso.com" no botão de voltar.
const BACK_PATH_PATTERN = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/

function getBackUrl(from?: string) {
  return from && BACK_PATH_PATTERN.test(from) ? `/${from}` : "/"
}

interface ComicResponse {
  data: Comic | null
  message?: string
}

interface ReaderPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

async function getComic(id: string): Promise<ComicResponse | null> {
  const response = await fetch(`${SERVER_API_URL}/api/comics/${encodeURIComponent(id)}`, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

export default async function ReaderPage({ params, searchParams }: ReaderPageProps) {
  const { id } = await params
  const { from } = await searchParams
  const result = await getComic(id)

  if (!result || !result.data) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-svh items-center justify-center bg-black"
      >
        <p className="text-xl text-white">HQ não encontrada</p>
      </main>
    )
  }

  const comic = result.data
  const backUrl = getBackUrl(from)

  if (!comic.downloadUrl) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-svh flex-col items-center justify-center gap-4 bg-black"
      >
        <p className="text-xl text-white">Esta HQ não possui arquivo para leitura</p>
        <a href={backUrl} className="text-dc-blue hover:underline">
          ← Voltar
        </a>
      </main>
    )
  }

  return (
    <ComicReader
      comicId={comic.id}
      downloadUrl={comic.downloadUrl}
      comicTitle={comic.title}
      comicUniverse={comic.universe}
      backUrl={backUrl}
    />
  )
}
