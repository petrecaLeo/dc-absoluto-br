"use client"

import type { CharacterImages } from "@/constants/character-images"
import { isOptimizedImageUrl } from "@/lib/remote-images"
import type { Character, CharacterUniverseSummary } from "@dc-absoluto/shared-types"
import { AlertTriangle, ArrowLeft, BookOpen, ChevronRight, Layers3, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface CharacterUniversesPageContentProps {
  slug: string
  character: Character | null
  universes: CharacterUniverseSummary[]
  theme: CharacterImages
  hasError: boolean
}

function formatReleaseDate(value?: string | Date | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function CharacterUniversesPageContent({
  slug,
  character,
  universes,
  theme,
  hasError,
}: CharacterUniversesPageContentProps) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-svh bg-dc-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dc-black/60 backdrop-blur-xl">
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

      <div className="relative isolate min-h-svh overflow-hidden pt-20">
        <div className="absolute inset-0">
          {theme.image && (
            <Image
              src={theme.image}
              alt={character?.name ?? slug}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_0_35%),linear-gradient(120deg,rgba(0,0,0,0.96)_12%,rgba(0,0,0,0.72)_48%,rgba(0,0,0,0.94)_100%)]" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(circle at 75% 25%, ${theme.accentColor}35, transparent 0 30%), radial-gradient(circle at 20% 80%, ${theme.gradientTo}40, transparent 0 28%)`,
            }}
          />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100svh-80px)] max-w-7xl flex-col justify-center px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:py-12">
          {hasError ? (
            <ErrorState slug={slug} />
          ) : !character ? (
            <NotFoundState />
          ) : universes.length === 0 ? (
            <EmptyState character={character} theme={theme} />
          ) : (
            <>
              <section className="w-full max-w-2xl lg:flex-1">
                <Link
                  href="/#characters"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Voltar aos personagens
                </Link>

                <div className="mt-8 max-w-xl">
                  <div
                    className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.25em]"
                    style={{
                      borderColor: `${theme.accentColor}55`,
                      backgroundColor: `${theme.accentColor}12`,
                      color: theme.accentColor,
                    }}
                  >
                    <Layers3 className="h-4 w-4" />
                    Escolha o universo
                  </div>

                  <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
                    {character.name}
                  </h1>

                  <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                    Esse personagem agora pode viver em mais de um universo por aqui. Escolha a
                    linha que você quer explorar e a gente te leva direto para as HQs
                    correspondentes.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.45]">
                        Universos
                      </p>
                      <p className="mt-1 text-2xl font-black text-white">{universes.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.45]">
                        HQs totais
                      </p>
                      <p className="mt-1 text-2xl font-black text-white">
                        {universes.reduce((total, universe) => total + universe.total, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-10 w-full lg:mt-0 lg:max-w-2xl lg:flex-1">
                <div className="grid gap-4">
                  {universes.map((universe, index) => {
                    const releaseDate = formatReleaseDate(universe.latestComic?.releaseDate)
                    const delay = `${index * 70}ms`

                    return (
                      <Link
                        key={universe.universe}
                        href={`/${slug}/${universe.universe}`}
                        className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] sm:p-5"
                        style={{ animationDelay: delay }}
                      >
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(135deg, ${theme.gradientFrom}55 0%, transparent 55%, ${theme.accentColor}25 100%)`,
                          }}
                        />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-lg font-black uppercase"
                              style={{
                                backgroundColor: `${theme.accentColor}15`,
                                color: theme.accentColor,
                              }}
                            >
                              {universe.label.slice(0, 2)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-black uppercase tracking-wide text-white">
                                  {universe.label}
                                </h2>
                                {index === 0 && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                                    <Sparkles className="h-3 w-3" />
                                    Novo
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-sm text-white/[0.68]">
                                {universe.total} {universe.total === 1 ? "HQ" : "HQs"} nesse
                                universo
                              </p>

                              {universe.latestComic && (
                                <p className="mt-2 text-xs text-white/[0.52]">
                                  Última:{" "}
                                  <span className="text-white/[0.72]">
                                    {universe.latestComic.title}
                                  </span>
                                  {releaseDate ? ` • ${releaseDate}` : ""}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:justify-end">
                            {universe.latestComic?.coverUrl ? (
                              <div className="relative hidden aspect-[623/959] w-20 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-2xl sm:block">
                                <Image
                                  src={universe.latestComic.coverUrl}
                                  unoptimized={
                                    !isOptimizedImageUrl(universe.latestComic.coverUrl)
                                  }
                                  alt={universe.latestComic.title}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="hidden h-20 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/20 sm:flex">
                                <BookOpen className="h-7 w-7 text-white/[0.18]" />
                              </div>
                            )}

                            <div
                              className="w-full sm:w-fit text-center inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-transform duration-300 group-hover:translate-x-1"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${theme.accentColor} 72%, black)`,
                              }}
                            >
                              Entrar
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
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
    <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10"
        style={{ backgroundColor: `${theme.accentColor}10` }}
      >
        <BookOpen className="h-10 w-10 text-white/30" />
      </div>
      <h2 className="mt-6 text-3xl font-black text-white">{character.name}</h2>
      <p className="mt-3 text-white/60">
        Ainda não existem universos com HQs cadastradas para esse personagem.
      </p>
      <Link
        href="/#characters"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/[0.65] transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Ver outros personagens
      </Link>
    </div>
  )
}

function ErrorState({ slug }: { slug: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-[32px] border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/10">
        <AlertTriangle className="h-10 w-10 text-red-300/70" />
      </div>
      <h2 className="mt-6 text-3xl font-black text-white">Falha ao carregar os universos</h2>
      <p className="mt-3 text-white/60">
        Não conseguimos montar a página de <strong className="text-white/80">{slug}</strong>{" "}
        agora. Tenta de novo em alguns instantes.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15"
        >
          Tentar novamente
        </button>
        <Link
          href="/#characters"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-white/[0.65] transition-all duration-300 hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
        <Layers3 className="h-10 w-10 text-white/30" />
      </div>
      <h2 className="mt-6 text-3xl font-black text-white">Personagem não encontrado</h2>
      <p className="mt-3 text-white/60">
        Esse slug não existe no catálogo atual. Escolhe outro personagem na home.
      </p>
      <Link
        href="/#characters"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/[0.65] transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Ver personagens
      </Link>
    </div>
  )
}
