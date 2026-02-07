"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import type { Character, Comic } from "@dc-absoluto/shared-types"
import { getCharacterComicsClient, getCharactersClient } from "@/services/characters.client"
import { getReadComicsByCharacter } from "@/services/read-comics.client"

const CHARACTERS_STALE_TIME = 1000 * 60 * 60 * 24 * 7

type ComicWithReadAt = Comic & { readAt: string }

async function getReadComicsByCharacterWithDetails(slug: string): Promise<ComicWithReadAt[]> {
  const readResponse = await getReadComicsByCharacter(slug)
  const readEntries = readResponse.data ?? []
  const readById = new Map(readEntries.map((entry) => [entry.comicId, entry.readAt]))

  if (readById.size === 0) {
    return []
  }

  const comicsResponse = await getCharacterComicsClient(slug)
  const enriched = comicsResponse.data
    .filter((comic) => readById.has(comic.id))
    .map((comic) => ({
      ...comic,
      readAt: readById.get(comic.id) ?? "",
    }))

  return enriched.sort((a, b) => {
    const dateA = new Date(a.readAt).getTime()
    const dateB = new Date(b.readAt).getTime()
    return dateB - dateA
  })
}

export function PerfilHqsLidas() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["characters"],
    queryFn: getCharactersClient,
    staleTime: CHARACTERS_STALE_TIME,
    gcTime: CHARACTERS_STALE_TIME,
  })

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">HQs lidas</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Personagens</h2>
        </div>
        <p className="text-sm text-white/70">Toque para ver suas leituras</p>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`characters-loading-${index}`}
                className="h-14 w-full animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            Não foi possível carregar os personagens agora.
          </div>
        ) : data.data.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Nenhum personagem disponível no momento.
          </div>
        ) : (
          data.data.map((character) => (
            <CharacterAccordion key={character.slug} character={character} />
          ))
        )}
      </div>
    </section>
  )
}

function CharacterAccordion({ character }: { character: Character }) {
  const [isOpen, setIsOpen] = useState(true)
  const contentId = `character-${character.slug}-read`

  const { data, isLoading, isError } = useQuery({
    queryKey: ["read-comics-by-character", character.slug],
    queryFn: () => getReadComicsByCharacterWithDetails(character.slug),
    enabled: isOpen,
  })

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-150 hover:bg-white/5"
      >
        <span className="text-sm font-semibold text-white">{character.name}</span>
        <span className="text-sm font-semibold text-white/60">{isOpen ? "-" : "+"}</span>
      </button>

      <div
        id={contentId}
        aria-hidden={!isOpen}
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-white/10 px-4 py-4">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`comics-loading-${index}`}
                  className="h-[320px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Não foi possível carregar suas HQs agora.
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-white/70">
              Você ainda não leu nenhuma.{" "}
              <Link
                href={`/${character.slug}`}
                className="cursor-pointer font-semibold text-sky-200! transition-colors hover:text-[#7ad9ff]"
              >
                Clique aqui para começar.
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {data.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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

function ComicCard({ comic }: { comic: ComicWithReadAt }) {
  const readDate = formatReadDate(comic.readAt)
  return (
    <article className="group relative flex w-[160px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] sm:w-[180px] lg:w-[200px]">
      <div className="relative aspect-[623/959] w-full overflow-hidden bg-dc-dark">
        {comic.coverUrl ? (
          <Image
            src={comic.coverUrl}
            alt={comic.title}
            fill
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw"
            quality={70}
            className="object-contain group-hover:brightness-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-dc-dark to-dc-black">
            <span className="text-sm font-bold text-white/15">.CBR</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">{comic.title}</h3>
        <p className="mt-2 text-xs text-white/50">
          <span className="text-white/70">Lido em:</span> {readDate || "--/--/----"}
        </p>
      </div>
    </article>
  )
}
