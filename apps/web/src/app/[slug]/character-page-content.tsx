"use client"

import { getStoredUser, subscribeAuthChanges } from "@/components/header/auth.storage"
import type { AuthUser } from "@/components/header/auth.types"
import type { CharacterImages } from "@/constants/character-images"
import { isOptimizedImageUrl } from "@/lib/remote-images"
import {
  type Character,
  type Comic,
  DEFAULT_COMIC_UNIVERSE,
  getComicUniverseLabel,
} from "@dc-absoluto/shared-types"
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  BookX,
  Check,
  Download,
  Loader2,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { PUBLIC_API_URL } from "@/lib/env/public"
import { getReadComicsByCharacter } from "@/services/read-comics.client"
import { type ReadingProgress, readingProgress } from "@/services/reading-progress"
import { useComicsFilter } from "./use-comics-filter"

interface CharacterPageContentProps {
  slug: string
  universe?: string
  character: Character | null
  comics: Comic[]
  total: number
  theme: CharacterImages
  hasError: boolean
  authUser: AuthUser | null
  readComics: ReadComicEntry[]
}

interface ReadComicEntry {
  comicId: string
  readAt: string
}

const characterSynopsisBySlug: Record<string, string> = {
  batman:
    "Gotham é aterrorizada por uma gangue de mascarados, e um vigilante enfrenta a cidade, mas não é o Batman que conhecemos. Neste universo absoluto, Bruce Wayne é jovem, sem a mansão Wayne e sem grandes fortunas, movido por uma motivação diferente como Cavaleiro das Trevas.",
  superman:
    "Em um mundo mais sombrio, Kal-El cai em um campo remoto do Kansas como o último sobrevivente de Krypton. Ao tentar sobreviver, ele entra em conflito com a corporação Lázaro e seu exército de pacificadores, enquanto o planeta parece repetir os erros de seu mundo destruído.",
  supergirl:
    "Vinda do planeta Krypton, Kara Zor-El chegou à Terra após a destruição de seu mundo natal. Prima de Kal-El, o Superman, ela possui os mesmos poderes extraordinários concedidos pelo Sol amarelo da Terra: força sobre-humana, voo, visão de calor e muito mais. Dividida entre sua herança kryptoniana e sua vida entre os humanos, Supergirl busca encontrar seu lugar no mundo enquanto protege inocentes de ameaças terrestres e cósmicas. Corajosa, determinada e inspiradora, Kara enfrenta desafios que testam não apenas seus poderes, mas também sua identidade, seus valores e a esperança que carrega consigo como uma das maiores heroínas do Universo DC.",
  "wonder-woman":
    "Diana foi exilada ao submundo quando bebê e criada pela feiticeira Circe, moldada por tragédia, perigo e magia. Retornando à superfície com armas forjadas no Inferno, sua missão se parece mais com justiça do que paz, enquanto busca seu lugar no mundo.",
  flash:
    "Wally West vê sua vida virar de cabeça para baixo e passa a ser caçado por quem antes confiava. Sem o mentor que o guiava, ele precisa encarar um mundo de perigos desconhecidos e definir quem será nesse novo universo.",
  "martian-manhunter":
    'O agente do FBI John Jones tem o cérebro infectado por uma consciência alienígena chamada "O Marciano", cuja percepção é incompreensível para a mente humana. Ele precisa lidar com esse novo estado enquanto cumpre seu trabalho, em uma jornada que redefine o próprio herói.',
  "green-lantern":
    "Em uma Terra alternativa, um alienígena desce sobre a cidade de Evergreen, Nevada, e julga seus moradores, entre eles Guy Gardner, Hal Jordan, John Stewart e Jo Mullein. Diante do terror e do custo de reagir, alguém precisa vencer o medo para emergir como herói.",
  catwoman:
    "Com toda a riqueza, todo o equipamento e todas as habilidades, ela é a Predadora Absoluta! Selina Kyle construiu uma boa vida para si: com engenhosidade e talento, tornou-se a maior ladra que o mundo já conheceu, e com equipamentos e armas de alta tecnologia não existe lugar seguro demais para a Mulher-Gato. Mas quando alguém do seu passado bate à sua porta, tudo o que ela construiu começa a desmoronar. Para sobreviver, Selina precisa desvendar um mistério que a leva ao redor do mundo e às sombras mais profundas do Universo Absoluto. Continuando de onde Batman Absoluto #14 parou, a série retoma os segredos do passado de Selina e seus laços misteriosos com o Máscara Negra, pelas mãos de Che Grayson e Scott Snyder, com arte de Bengal.",
  "green-arrow":
    "Um serial killer está assassinando bilionários corruptos. A única pista sobre sua identidade são as misteriosas flechas verdes cravadas nos corpos de suas vítimas. A especialista em proteção executiva Dinah Lance, também conhecida como Canário Negro Absoluta, é uma das responsáveis por descobrir quem está por trás desses crimes. Durante sua investigação, ela passa a analisar uma lista de suspeitos formada por arqueiros conhecidos do Universo DC, todos ligados de alguma forma a um recentemente assassinado Oliver Queen. Misturando a premissa de Eu Sei o Que Vocês Fizeram no Verão Passado com uma trama voltada para bilionários, Arqueiro Verde Absoluto reinventa a mitologia do Arqueiro Esmeralda como um perigoso suspense urbano de horror e mistério policial, pelas mãos dos vencedores do Prêmio Eisner Pornsak Pichetshote (Dead Boy Detectives, Infidel) e Rafael Albuquerque (Detective Comics, American Vampire).",
}

const characterUniverseSynopsisByKey: Record<string, string[]> = {
  "green-lantern:geoff-johns": [
    "Antes de Lanterna Verde: Renascimento, a história do universo dos Lanternas passou por uma das fases mais sombrias e controversas da DC.",
    "Tudo começa com uma tragédia marcante: a destruição de Coast City, cidade natal de Hal Jordan. Incapaz de lidar com a perda, Hal entra em colapso emocional e tenta usar o poder do anel para reconstruir a cidade — algo que vai contra todas as regras da Tropa dos Lanternas Verdes.",
    "Esse momento leva a uma queda drástica do personagem. Hal confronta os próprios Lanternas, derrota vários membros da Tropa e chega até Sinestro, seu antigo mentor. Ao absorver uma quantidade imensa de energia dos anéis, ele assume a identidade de Parallax, tornando-se uma ameaça para todo o universo.",
    "Como consequência, a Tropa dos Lanternas Verdes praticamente deixa de existir.",
    "É nesse cenário que surge Kyle Rayner, um artista comum escolhido como o último portador do anel. Durante um longo período, Kyle se torna o único Lanterna Verde ativo, carregando sozinho o legado e reconstruindo, aos poucos, o que restou da Tropa.",
    "E após a união de Kyle e a Liga de Justiça, Hal é, finalmente, derrotado.",
    'Porém, posteriormente, na saga "The Final Night", o Sol da Terra começa a se apagar, colocando o planeta em risco. Nesse momento, Hal recupera parte de sua consciência e, em um ato de redenção, se sacrifica para reacender o Sol, salvando bilhões de vidas.',
    "Após sua morte, sua alma não segue um caminho comum. Em vez disso, Hal é escolhido para se tornar o novo hospedeiro do Espectro, o espírito da vingança. Nesse papel, ele passa a julgar almas e buscar redenção pelos seus próprios erros, embora frequentemente demonstrando conflito interno entre justiça e culpa.",
    "Enquanto isso, o legado dos Lanternas começa lentamente a ser reconstruído. Kyle Rayner, inicialmente o último Lanterna Verde, evolui ao longo dos anos e eventualmente consegue restaurar a Bateria Central de Oa e reacender o poder dos anéis. Esse processo permite o retorno gradual da Tropa dos Lanternas Verdes, trazendo de volta figuras importantes como John Stewart e Guy Gardner ao papel de Lanternas.",
    "Assim, quando Renascimento começa, o universo já está em reconstrução — a Tropa existe novamente, novos equilíbrios foram formados e Hal Jordan, agora como Espectro, ainda carrega o peso de tudo o que aconteceu.",
    "Mas apesar dessa aparente estabilidade, algo ainda não está certo.",
    "Essa seção inclui os volumes, já ordenados:",
    "Lanterna Verde: Renascimento",
    "Lanterna Verde: Sem Medo",
    "Lanterna Verde: A Vingança Dos Lanternas Verdes",
    "Lanterna Verde: Hal Jordan: Procurado",
    "Lanterna Verde: O Lado Negro Do Verde",
  ],
}

const DEFAULT_VISIBLE_UNIVERSE_SYNOPSIS_ITEMS = 3

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

function isProgressForUser(progress: ReadingProgress | null, authUser: AuthUser | null) {
  if (!progress) return false
  if (!authUser) return !progress.userId
  return progress.userId === authUser.id
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
  universe = DEFAULT_COMIC_UNIVERSE,
  character,
  comics,
  total,
  theme,
  hasError,
  authUser,
  readComics,
}: CharacterPageContentProps) {
  const latestComic = getLatestComic(comics)
  const apiUrl = PUBLIC_API_URL

  return (
    <main id="main-content" tabIndex={-1} className="min-h-svh bg-dc-black">
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
          <EmptyState character={character} theme={theme} universe={universe} />
        ) : character ? (
          <>
            <HeroSection character={character} theme={theme} total={total} universe={universe} />
            <ComicsGrid
              comics={comics}
              slug={slug}
              universe={universe}
              theme={theme}
              latestComic={latestComic}
              apiUrl={apiUrl}
              authUser={authUser}
              readComics={readComics}
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
  universe,
}: {
  character: Character
  theme: CharacterImages
  total: number
  universe: string
}) {
  const universeLabel = getComicUniverseLabel(universe)
  const isAbsoluteUniverse = universe === DEFAULT_COMIC_UNIVERSE
  const universeSynopsis = characterUniverseSynopsisByKey[`${character.slug}:${universe}`]

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
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                borderColor: `${theme.accentColor}55`,
                backgroundColor: `${theme.accentColor}15`,
                color: theme.accentColor,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {universeLabel}
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              {character.name}
            </h1>
            {isAbsoluteUniverse && character.alias && (
              <p className="mt-2 text-lg italic text-white/60">{character.alias}</p>
            )}
            {isAbsoluteUniverse && characterSynopsisBySlug[character.slug] && (
              <p className="mt-4 max-w-2xl text-sm text-white/70 md:text-base">
                {characterSynopsisBySlug[character.slug]}
              </p>
            )}
            {!isAbsoluteUniverse && universeSynopsis && (
              <UniverseSynopsis
                key={`${character.slug}:${universe}`}
                paragraphs={universeSynopsis}
              />
            )}
            {!isAbsoluteUniverse && !universeSynopsis && (
              <p className="mt-4 max-w-2xl text-sm text-white/70 md:text-base">
                Explore as HQs de {character.name} dentro do universo {universeLabel}. A listagem
                abaixo mostra apenas as edições dessa linha.
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

function UniverseSynopsis({ paragraphs }: { paragraphs: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleParagraphs = isExpanded
    ? paragraphs
    : paragraphs.slice(0, DEFAULT_VISIBLE_UNIVERSE_SYNOPSIS_ITEMS)
  const hasHiddenParagraphs =
    paragraphs.length > DEFAULT_VISIBLE_UNIVERSE_SYNOPSIS_ITEMS && !isExpanded

  return (
    <div className="mt-4 max-w-4xl space-y-4 text-sm text-white/70 md:text-base">
      {visibleParagraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {paragraphs.length > DEFAULT_VISIBLE_UNIVERSE_SYNOPSIS_ITEMS && (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="cursor-pointer text-sm font-medium text-white underline underline-offset-4 transition-opacity hover:opacity-80 md:text-base"
        >
          {hasHiddenParagraphs ? "Ler mais" : "Ler menos"}
        </button>
      )}
    </div>
  )
}

function ComicsGrid({
  comics,
  slug,
  universe,
  theme,
  latestComic,
  apiUrl,
  authUser,
  readComics,
}: {
  comics: Comic[]
  slug: string
  universe: string
  theme: CharacterImages
  latestComic: Comic | null
  apiUrl: string
  authUser: AuthUser | null
  readComics: ReadComicEntry[]
}) {
  const {
    sortOrder,
    editionFilter,
    hasSpecialEditions,
    sortedComics,
    setSortOrder,
    setEditionFilter,
  } = useComicsFilter(comics)
  const [authUserState, setAuthUserState] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return authUser
    return getStoredUser()
  })
  const [readingProgressMap, setReadingProgressMap] = useState<Record<string, ReadingProgress>>({})
  const [readComicsState, setReadComicsState] = useState<ReadComicEntry[]>(() =>
    authUserState && authUser && authUserState.id === authUser.id ? readComics : [],
  )
  const [readingFilter, setReadingFilter] = useState<"read" | "unread" | null>(null)
  const didInitialProgressLoad = useRef(false)

  useEffect(() => {
    setAuthUserState(getStoredUser())

    const unsubscribe = subscribeAuthChanges((user) => {
      setAuthUserState(user)
    })

    return () => unsubscribe()
  }, [])

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

  useLayoutEffect(() => {
    if (didInitialProgressLoad.current) return
    refreshReadingProgress()
    didInitialProgressLoad.current = true
  }, [refreshReadingProgress])

  useEffect(() => {
    if (!didInitialProgressLoad.current) {
      refreshReadingProgress()
      didInitialProgressLoad.current = true
    }

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

  useEffect(() => {
    if (!authUserState) {
      setReadComicsState([])
      return
    }

    if (authUser && authUserState.id === authUser.id) {
      setReadComicsState(readComics)
      return
    }

    setReadComicsState([])
  }, [authUser, authUserState, readComics])

  useEffect(() => {
    if (!authUserState) {
      setReadingFilter(null)
      return
    }

    let cancelled = false

    const syncReadComics = async () => {
      try {
        const response = await getReadComicsByCharacter(slug)
        if (!cancelled) {
          setReadComicsState(response.data ?? [])
        }
      } catch {
        if (!cancelled) {
          setReadComicsState([])
        }
      }
    }

    void syncReadComics()

    return () => {
      cancelled = true
    }
  }, [authUserState, slug])

  useEffect(() => {
    if (!authUserState || readComicsState.length === 0) {
      setReadingFilter(null)
    }
  }, [authUserState, readComicsState.length])

  const hasReadComics = useMemo(() => {
    return authUserState ? readComicsState.length > 0 : false
  }, [authUserState, readComicsState])

  const readComicIds = useMemo(
    () => readComicsState.map((entry) => entry.comicId),
    [readComicsState],
  )
  const readComicIdsSet = useMemo(() => new Set(readComicIds), [readComicIds])
  const readComicDates = useMemo(
    () => new Map(readComicsState.map((entry) => [entry.comicId, entry.readAt])),
    [readComicsState],
  )

  const handleMarkComicRead = useCallback(
    async (comicId: string) => {
      if (!authUserState) return false

      try {
        const response = await fetch(`/api/comics/${comicId}/read`, {
          method: "POST",
        })

        if (!response.ok) return false

        const optimisticReadAt = new Date().toISOString()
        setReadComicsState((prev) => {
          if (prev.some((entry) => entry.comicId === comicId)) return prev
          return [...prev, { comicId, readAt: optimisticReadAt }]
        })

        return true
      } catch {
        return false
      }
    },
    [authUserState],
  )

  const visibleComics = useMemo(() => {
    if (!authUserState || !readingFilter || !hasReadComics) return sortedComics

    return sortedComics.filter((comic) => {
      const readStatus = readComicIdsSet.has(comic.id)

      return readingFilter === "read" ? readStatus : !readStatus
    })
  }, [authUserState, hasReadComics, readComicIdsSet, readingFilter, sortedComics])

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
          {authUserState && hasReadComics && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <span className="text-sm font-medium text-white/70">Status de leitura:</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <FilterButton
                  isActive={readingFilter === "read"}
                  onClick={() =>
                    setReadingFilter((current) => (current === "read" ? null : "read"))
                  }
                  theme={theme}
                  label="Lidos"
                  icon="book"
                />
                <FilterButton
                  isActive={readingFilter === "unread"}
                  onClick={() =>
                    setReadingFilter((current) => (current === "unread" ? null : "unread"))
                  }
                  theme={theme}
                  label="Não lidos"
                  icon="book-x"
                />
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleComics.map((comic, index) => {
            const progress = readingProgressMap[comic.id] ?? null
            const isOwnedProgress = isProgressForUser(progress, authUserState)
            const isRead = Boolean(authUserState && readComicIdsSet.has(comic.id))
            const readAt = readComicDates.get(comic.id)

            return (
              <ComicCard
                key={comic.id}
                comic={comic}
                slug={slug}
                universe={universe}
                theme={theme}
                isLatest={latestComic?.id === comic.id}
                hasReadingInProgress={isOwnedProgress && hasReadingInProgress(progress)}
                isRead={isRead}
                readAt={readAt}
                canManageRead={Boolean(authUserState)}
                onMarkRead={handleMarkComicRead}
                index={index}
                apiUrl={apiUrl}
              />
            )
          })}
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
  icon: "star" | "book" | "book-x"
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
      ) : icon === "book-x" ? (
        <BookX className="h-4 w-4" style={{ color: theme.accentColor }} />
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
  universe,
  theme,
  isLatest,
  hasReadingInProgress,
  isRead,
  readAt,
  canManageRead,
  onMarkRead,
  index,
  apiUrl,
}: {
  comic: Comic
  slug: string
  universe: string
  theme: CharacterImages
  isLatest: boolean
  hasReadingInProgress: boolean
  isRead: boolean
  readAt?: string
  canManageRead: boolean
  onMarkRead: (comicId: string) => Promise<boolean>
  index: number
  apiUrl: string
}) {
  const isNew = isLatest && isNewComic(comic.releaseDate)
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const router = useRouter()

  function handleReadOnline() {
    setIsLoading(true)
    router.push(`/ler/${comic.id}?from=${slug}/${universe}`)
  }

  async function handleMarkRead() {
    if (isMarkingRead || isRead) return
    setIsMarkingRead(true)
    const marked = await onMarkRead(comic.id)
    if (!marked) {
      setIsMarkingRead(false)
    }
  }

  const readDateLabel = formatReadDate(readAt)

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
      {isRead && (
        <div
          className="absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]"
          title="Lido"
        >
          <Check className="h-4 w-4 text-white" />
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
            unoptimized={!isOptimizedImageUrl(comic.coverUrl)}
            alt={comic.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 250px"
            quality={70}
            priority={index < 4}
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
        <h2 className="text-sm font-bold leading-tight text-white line-clamp-2">{comic.title}</h2>

        <div className="mt-2 space-y-0.5">
          {comic.releaseDate && (
            <p className="text-xs text-white/60 line-clamp-1" suppressHydrationWarning>
              <span className="text-white/75">Publicação (EUA):</span>{" "}
              {new Date(comic.releaseDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
          )}
          {comic.writer && (
            <p className="text-xs text-white/60 line-clamp-1">
              <span className="text-white/75">Roteiro:</span> {comic.writer}
            </p>
          )}
          {comic.artists && (
            <p className="text-xs text-white/60 line-clamp-1">
              <span className="text-white/75">Arte:</span> {comic.artists}
            </p>
          )}
        </div>

        {(canManageRead || comic.downloadUrl) && (
          <div className="mt-auto flex flex-col gap-2 pt-3">
            {canManageRead &&
              (isRead ? (
                <p className="text-xs font-semibold" style={{ color: theme.accentColor }}>
                  Lido em: {readDateLabel || "--/--/----"}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkRead}
                  disabled={isMarkingRead}
                  aria-busy={isMarkingRead}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 disabled:cursor-wait disabled:opacity-80"
                  style={{
                    borderColor: `${theme.accentColor}55`,
                    backgroundColor: `${theme.accentColor}18`,
                    color: `color-mix(in srgb, ${theme.accentColor} 75%, black)`,
                  }}
                >
                  {isMarkingRead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="hidden h-4 w-4 sm:block" />
                  )}
                  Marcar como lida
                </button>
              ))}
            {comic.downloadUrl && (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                <button
                  type="button"
                  onClick={handleReadOnline}
                  disabled={isLoading}
                  aria-busy={isLoading}
                  aria-label={isLoading ? "Carregando página de leitura" : undefined}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition-all duration-300 hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.accentColor} 75%, black)`,
                  }}
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
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  <span className="sm:hidden">Baixar</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function formatReadDate(value?: string) {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function EmptyState({
  character,
  theme,
  universe,
}: {
  character: Character
  theme: CharacterImages
  universe: string
}) {
  const universeLabel = getComicUniverseLabel(universe)

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
          Nenhuma HQ encontrada para este personagem no universo {universeLabel} ainda. Novas
          edições são adicionadas regularmente, volte em breve!
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
