"use client"

import type { CharacterImages } from "@/constants/character-images"
import type { Character, Comic } from "@dc-absoluto/shared-types"
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  BookX,
  Download,
  Loader2,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { readingProgress, type ReadingProgress } from "@/services/reading-progress"
import { useComicsFilter } from "./use-comics-filter"

interface CharacterPageContentProps {
  slug: string
  character: Character | null
  comics: Comic[]
  total: number
  theme: CharacterImages
  hasError: boolean
}

const characterSynopsisBySlug: Record<string, string> = {
  batman:
    "Gotham é aterrorizada por uma gangue de mascarados, e um vigilante enfrenta a cidade, mas não é o Batman que conhecemos. Neste universo absoluto, Bruce Wayne é jovem, sem a mansão Wayne e sem grandes fortunas, movido por uma motivação diferente como Cavaleiro das Trevas.",
  superman:
    "Em um mundo mais sombrio, Kal-El cai em um campo remoto do Kansas como o último sobrevivente de Krypton. Ao tentar sobreviver, ele entra em conflito com a corporação Lázaro e seu exército de pacificadores, enquanto o planeta parece repetir os erros de seu mundo destruído.",
  "wonder-woman":
    "Diana foi exilada ao submundo quando bebê e criada pela feiticeira Circe, moldada por tragédia, perigo e magia. Retornando à superfície com armas forjadas no Inferno, sua missão se parece mais com justiça do que paz, enquanto busca seu lugar no mundo.",
  flash:
    "Wally West vê sua vida virar de cabeça para baixo e passa a ser caçado por quem antes confiava. Sem o mentor que o guiava, ele precisa encarar um mundo de perigos desconhecidos e definir quem será nesse novo universo.",
  "martian-manhunter":
    'O agente do FBI John Jones tem o cérebro infectado por uma consciência alienígena chamada "O Marciano", cuja percepção é incompreensível para a mente humana. Ele precisa lidar com esse novo estado enquanto cumpre seu trabalho, em uma jornada que redefine o próprio herói.',
  "green-lantern":
    "Em uma Terra alternativa, um alienígena desce sobre a cidade de Evergreen, Nevada, e julga seus moradores, entre eles Guy Gardner, Hal Jordan, John Stewart e Jo Mullein. Diante do terror e do custo de reagir, alguém precisa vencer o medo para emergir como herói.",
}

function isNewComic(releaseDate?: Date) {
  if (!releaseDate) return false
  const now = new Date()
  const release = new Date(releaseDate)
  const diffMs = now.getTime() - release.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= 40
}

const READING_COMPLETION_BUFFER = 5

function hasReadingInProgress(progress: ReadingProgress | null) {
  if (!progress) return false
  if (!Number.isFinite(progress.page) || !Number.isFinite(progress.totalPages)) return false
  if (progress.totalPages <= READING_COMPLETION_BUFFER) return false

  return progress.page + 1 < progress.totalPages - READING_COMPLETION_BUFFER
}

function getLatestComic(comics: Comic[]): Comic | null {
  if (comics.length === 0) return null
  return comics.reduce((latest, comic) => {
    if (!comic.releaseDate) return latest
    if (!latest.releaseDate) return comic
    return new Date(comic.releaseDate) > new Date(latest.releaseDate) ? comic : latest
  })
}

export function CharacterPageContent({
  slug,
  character,
  comics,
  total,
  theme,
  hasError,
}: CharacterPageContentProps) {
  const latestComic = getLatestComic(comics)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-dc-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-dc-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <nav className="flex items-center justify-between">
            <Link href="/" className="shrink-0">
              <Image
                src="/images/logo.png"
                alt="DC Absoluto BR"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </nav>
        </div>
      </header>

      <div className="pt-20">
        {hasError ? (
          <ErrorState slug={slug} />
        ) : character && comics.length === 0 ? (
          <EmptyState character={character} theme={theme} />
        ) : character ? (
          <>
            <HeroSection character={character} theme={theme} total={total} />
            <ComicsGrid
              comics={comics}
              slug={slug}
              theme={theme}
              latestComic={latestComic}
              apiUrl={apiUrl}
            />
          </>
        ) : (
          <NotFoundState theme={theme} />
        )}
      </div>
    </main>
  )
}

function HeroSection({
  character,
  theme,
  total,
}: {
  character: Character
  theme: CharacterImages
  total: number
}) {
  return (
    <section className="relative overflow-hidden py-6 px-4 sm:px-6 lg:py-10">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${theme.gradientFrom}, transparent 70%), radial-gradient(ellipse at 70% 80%, ${theme.gradientTo}, transparent 60%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.accentColor}40, transparent)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <Link
          href="/#characters"
          className="group mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Voltar aos personagens
        </Link>

        <div className="flex items-end gap-6">
          <div className="flex-1">
            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              {character.name}
            </h1>
            {character.alias && (
              <p className="mt-2 text-lg italic text-white/40">{character.alias}</p>
            )}
            {characterSynopsisBySlug[character.slug] && (
              <p className="mt-4 max-w-2xl text-sm text-white/70 md:text-base">
                {characterSynopsisBySlug[character.slug]}
              </p>
            )}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10"
              style={{ backgroundColor: `${theme.accentColor}15` }}
            >
              <BookOpen className="h-7 w-7" style={{ color: theme.accentColor }} />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{total}</p>
              <p className="text-sm text-white/50">
                {total === 1 ? "HQ publicada" : "HQs publicadas"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 md:hidden">
          <BookOpen className="h-5 w-5" style={{ color: theme.accentColor }} />
          <p className="text-sm text-white/60">
            <span className="font-bold text-white">{total}</span>{" "}
            {total === 1 ? "HQ encontrada" : "HQs encontradas"}
          </p>
        </div>
      </div>
    </section>
  )
}

function ComicsGrid({
  comics,
  slug,
  theme,
  latestComic,
  apiUrl,
}: {
  comics: Comic[]
  slug: string
  theme: CharacterImages
  latestComic: Comic | null
  apiUrl: string
}) {
  const {
    sortOrder,
    editionFilter,
    hasSpecialEditions,
    sortedComics,
    setSortOrder,
    setEditionFilter,
  } = useComicsFilter(comics)
  const [readingProgressMap, setReadingProgressMap] = useState<Record<string, ReadingProgress>>({})

  const refreshReadingProgress = useCallback(() => {
    const nextMap: Record<string, ReadingProgress> = {}

    for (const comic of comics) {
      const progress = readingProgress.getProgress(comic.id)
      if (progress) {
        nextMap[comic.id] = progress
      }
    }

    setReadingProgressMap(nextMap)
  }, [comics])

  useEffect(() => {
    refreshReadingProgress()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshReadingProgress()
      }
    }

    window.addEventListener("focus", refreshReadingProgress)
    window.addEventListener("pageshow", refreshReadingProgress)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", refreshReadingProgress)
      window.removeEventListener("pageshow", refreshReadingProgress)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshReadingProgress])

  return (
    <section className="mt-6 px-4 pb-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <span className="text-sm font-medium text-white/70">Ordenar por:</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <OrderButton
                isActive={sortOrder === "oldest"}
                onClick={() => setSortOrder("oldest")}
                theme={theme}
                icon="up"
                label="Mais antigo"
              />
              <OrderButton
                isActive={sortOrder === "newest"}
                onClick={() => setSortOrder("newest")}
                theme={theme}
                icon="down"
                label="Mais recente"
              />
            </div>
          </div>
          {hasSpecialEditions && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <span className="text-sm font-medium text-white/70">Filtrar por:</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <FilterButton
                  isActive={editionFilter === "all"}
                  onClick={() => setEditionFilter("all")}
                  theme={theme}
                  label="Edições regulares"
                  icon="book"
                />
                <FilterButton
                  isActive={editionFilter === "special"}
                  onClick={() => setEditionFilter("special")}
                  theme={theme}
                  label="Edições especiais"
                  icon="star"
                />
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sortedComics.map((comic, index) => (
            <ComicCard
              key={comic.id}
              comic={comic}
              slug={slug}
              theme={theme}
              isLatest={latestComic?.id === comic.id}
              hasReadingInProgress={hasReadingInProgress(readingProgressMap[comic.id] ?? null)}
              index={index}
              apiUrl={apiUrl}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function OrderButton({
  isActive,
  onClick,
  theme,
  icon,
  label,
}: {
  isActive: boolean
  onClick: () => void
  theme: CharacterImages
  icon: "up" | "down"
  label: string
}) {
  const activeClass = "border-white/30 text-white"
  const inactiveClass = "border-white/10 text-white/70 hover:border-white/20 hover:text-white"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-300 select-none sm:px-4 sm:py-2 ${
        isActive ? activeClass : inactiveClass
      }`}
      style={isActive ? { borderColor: theme.accentColor } : undefined}
    >
      {icon === "up" ? (
        <ArrowUp className="h-4 w-4" style={{ color: theme.accentColor }} />
      ) : (
        <ArrowDown className="h-4 w-4" style={{ color: theme.accentColor }} />
      )}
      {label}
    </button>
  )
}

function FilterButton({
  isActive,
  onClick,
  theme,
  label,
  icon,
}: {
  isActive: boolean
  onClick: () => void
  theme: CharacterImages
  label: string
  icon: "star" | "book"
}) {
  const activeClass = "border-white/30 text-white"
  const inactiveClass = "border-white/10 text-white/70 hover:border-white/20 hover:text-white"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-300 sm:px-4 sm:py-2 ${
        isActive ? activeClass : inactiveClass
      }`}
      style={isActive ? { borderColor: theme.accentColor } : undefined}
    >
      {icon === "star" ? (
        <Star
          className="h-4 w-4"
          style={{ color: theme.accentColor }}
          fill={isActive ? theme.accentColor : "none"}
        />
      ) : (
        <BookOpen className="h-4 w-4" style={{ color: theme.accentColor }} />
      )}
      {label}
    </button>
  )
}

function ComicCard({
  comic,
  slug,
  theme,
  isLatest,
  hasReadingInProgress,
  index,
  apiUrl,
}: {
  comic: Comic
  slug: string
  theme: CharacterImages
  isLatest: boolean
  hasReadingInProgress: boolean
  index: number
  apiUrl: string
}) {
  const isNew = isLatest && isNewComic(comic.releaseDate)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  function handleReadOnline() {
    setIsLoading(true)
    router.push(`/ler/${comic.id}?from=${slug}`)
  }

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06]"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
      }}
    >
      {isNew && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-dc-gold px-3 py-1 text-xs font-bold text-dc-black">
          <Sparkles className="h-3 w-3" />
          NOVO
        </div>
      )}

      <div className="relative aspect-[623/959] w-full overflow-hidden bg-dc-dark">
        {hasReadingInProgress && (
          <div className="absolute bottom-3 left-3 z-10 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/70 backdrop-blur sm:px-2.5 sm:py-1 sm:text-[10px]">
            <span className="sm:hidden">Em andamento</span>
            <span className="hidden sm:inline">Leitura em andamento</span>
          </div>
        )}
        {comic.coverUrl ? (
          <Image
            src={comic.coverUrl}
            alt={comic.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 250px"
            quality={70}
            className="object-cover group-hover:brightness-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-dc-dark to-dc-black">
            <BookOpen className="h-12 w-12 text-white/10" />
            <span className="text-sm font-bold text-white/15">.CBR</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-bold leading-tight text-white line-clamp-2">{comic.title}</h3>

        <div className="mt-2 space-y-0.5">
          {comic.releaseDate && (
            <p className="text-xs text-white/40 line-clamp-1" suppressHydrationWarning>
              <span className="text-white/60">Publicação (EUA):</span>{" "}
              {new Date(comic.releaseDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
          )}
          {comic.writer && (
            <p className="text-xs text-white/40 line-clamp-1">
              <span className="text-white/60">Roteiro:</span> {comic.writer}
            </p>
          )}
          {comic.artists && (
            <p className="text-xs text-white/40 line-clamp-1">
              <span className="text-white/60">Arte:</span> {comic.artists}
            </p>
          )}
        </div>

        {comic.downloadUrl && (
          <div className="mt-auto flex flex-col gap-1.5 pt-3 sm:flex-row sm:gap-2">
            <button
              type="button"
              onClick={handleReadOnline}
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label={isLoading ? "Carregando página de leitura" : undefined}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition-all duration-300 hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
              style={{ backgroundColor: theme.accentColor }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  <span className="sm:hidden">Ler</span>
                  <span className="hidden sm:inline">Ler Online</span>
                </>
              )}
            </button>
            <a
              aria-label={`Baixar HQ ${comic.title}`}
              href={`${apiUrl}/api/proxy/download?url=${encodeURIComponent(comic.downloadUrl)}`}
              download
              title="Download"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Download className="h-4 w-4" />
              <span className="sm:hidden">Baixar</span>
            </a>
          </div>
        )}
      </div>
    </article>
  )
}

function EmptyState({
  character,
  theme,
}: {
  character: Character
  theme: CharacterImages
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 sm:px-6">
      <div className="relative max-w-md text-center">
        <div
          className="absolute inset-0 -z-10 opacity-10 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${theme.accentColor}, transparent 70%)`,
          }}
        />

        <div
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10"
          style={{ backgroundColor: `${theme.accentColor}10` }}
        >
          <BookX className="h-12 w-12 text-white/20" />
        </div>

        <h2 className="text-2xl font-bold text-white">{character.name}</h2>
        <p className="mt-3 text-white/50 leading-relaxed">
          Nenhuma HQ encontrada para este personagem ainda. Novas edições são adicionadas
          regularmente, volte em breve!
        </p>

        <Link
          href="/#characters"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Ver outros personagens
        </Link>
      </div>
    </div>
  )
}

function ErrorState({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 sm:px-6">
      <div className="relative max-w-md text-center">
        <div className="absolute inset-0 -z-10 opacity-10 blur-3xl">
          <div className="h-full w-full rounded-full bg-dc-red" />
        </div>

        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-dc-red/20 bg-dc-red/10">
          <AlertTriangle className="h-12 w-12 text-dc-red/60" />
        </div>

        <h2 className="text-2xl font-bold text-white">Ops, algo deu errado</h2>
        <p className="mt-3 text-white/50 leading-relaxed">
          Não conseguimos carregar as HQs de <strong className="text-white/70">{slug}</strong>. Pode
          ser um problema temporário — tente novamente em alguns instantes.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-white/15"
          >
            Tentar novamente
          </button>
          <Link
            href="/#characters"
            className="flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/60 transition-all duration-300 hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </div>
    </div>
  )
}

function NotFoundState({ theme }: { theme: CharacterImages }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 sm:px-6">
      <div className="relative max-w-md text-center">
        <div
          className="absolute inset-0 -z-10 opacity-10 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${theme.accentColor}, transparent 70%)`,
          }}
        />

        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
          <Users className="h-12 w-12 text-white/20" />
        </div>

        <h2 className="text-2xl font-bold text-white">Personagem não encontrado</h2>
        <p className="mt-3 text-white/50 leading-relaxed">
          Não encontramos esse personagem no nosso catálogo. Confira os personagens disponíveis na
          página inicial.
        </p>

        <Link
          href="/#characters"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-dc-blue px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-dc-blue/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Ver personagens
        </Link>
      </div>
    </div>
  )
}
