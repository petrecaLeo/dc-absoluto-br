import { ComicReader } from "@/components/comic-reader"
import type { Comic } from "@dc-absoluto/shared-types"

interface ComicResponse {
  data: Comic | null
  message?: string
}

interface ReaderPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

async function getComic(id: string): Promise<ComicResponse | null> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  const response = await fetch(`${apiUrl}/api/comics/${id}`, {
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
  const backUrl = from ? `/${from}` : "/"

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
      backUrl={backUrl}
    />
  )
}
