"use client"

import Image from "next/image"
import { useState } from "react"

export interface LatestComic {
  id: string
  title: string
  coverUrl?: string | null
  downloadUrl?: string | null
  releaseDate?: string | Date | null
  writer?: string | null
  artists?: string | null
}

interface LatestLaunchProps {
  comic: LatestComic | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function formatReleaseDate(releaseDate?: string | Date | null): string | null {
  if (!releaseDate) return null
  return new Date(releaseDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function LatestLaunch({ comic }: LatestLaunchProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!comic) {
    return null
  }

  const releaseDateLabel = formatReleaseDate(comic.releaseDate)
  const downloadUrl = comic.downloadUrl
    ? `${API_URL}/api/proxy/download?url=${encodeURIComponent(comic.downloadUrl)}`
    : null

  const drawerTabIndex = isOpen ? 0 : -1
  const handleToggle = () => setIsOpen((prev) => !prev)

  return (
    <div className="pointer-events-auto absolute left-4 top-24 z-40 sm:left-6 sm:top-auto sm:bottom-6">
      <div className="relative hidden h-[270px] items-center gap-5 overflow-hidden rounded-l-2xl bg-[linear-gradient(to_right,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.95)_90%,rgba(0,0,0,0)_100%)] lg:inline-flex">
        <div className="relative h-full aspect-[623/959]">
          {comic.coverUrl ? (
            <Image
              src={comic.coverUrl}
              alt={comic.title}
              fill
              sizes="(max-width: 1024px) 50vw, 220px"
              priority
              fetchPriority="high"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-dc-dark">
              <span className="text-xs font-bold text-white/30">.cbr</span>
            </div>
          )}

          <Image
            src="/images/latest/new.png"
            alt="Novo"
            width={120}
            height={120}
            className="absolute -bottom-1 -left-1 h-auto w-18"
          />
        </div>

        <div className="flex h-full flex-col justify-center pr-6">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">
            Último lançamento
          </span>
          <h3 className="mt-1 text-xl font-black text-white uppercase">{comic.title}</h3>

          <div className="mt-3 space-y-1 text-xs text-white/70">
            {releaseDateLabel && (
              <p className="line-clamp-1">
                <span className="text-white/50">Data:</span> {releaseDateLabel} (EUA)
              </p>
            )}
            {comic.writer && (
              <p className="line-clamp-1">
                <span className="text-white/50">Autores:</span> {comic.writer}
              </p>
            )}
            {comic.artists && (
              <p className="line-clamp-1">
                <span className="text-white/50">Artistas:</span> {comic.artists}
              </p>
            )}
          </div>

          {downloadUrl && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={`/ler/${comic.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Ler online
              </a>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Download
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="relative lg:hidden">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="latest-launch-drawer"
          aria-label={isOpen ? "Ocultar último lançamento" : "Mostrar último lançamento"}
          onClick={handleToggle}
          className="relative z-20 inline-flex items-center justify-center"
        >
          <Image
            src="/images/latest/new.png"
            alt="Novo"
            width={160}
            height={160}
            className="h-auto w-24 sm:w-28"
          />
        </button>

        <div
          id="latest-launch-drawer"
          aria-hidden={!isOpen}
          className={`absolute left-0 top-full mt-3 w-[min(90vw,420px)] overflow-hidden transition-all duration-300 sm:bottom-full sm:top-auto sm:mb-3 sm:mt-0 ${
            isOpen
              ? "max-h-[260px] translate-y-0 opacity-100 sm:translate-y-0"
              : "pointer-events-none max-h-0 -translate-y-2 opacity-0 sm:translate-y-2"
          }`}
        >
          <div className="relative inline-flex h-[230px] items-center gap-4 overflow-hidden rounded-l-2xl bg-[linear-gradient(to_right,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.95)_90%,rgba(0,0,0,0)_100%)] px-4">
            <div className="flex h-full flex-col justify-center">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">
                Último lançamento
              </span>
              <h3 className="mt-1 text-base font-black text-white uppercase">{comic.title}</h3>

              <div className="mt-3 space-y-1 text-[11px] text-white/70">
                {releaseDateLabel && (
                  <p className="line-clamp-1">
                    <span className="text-white/50">Data:</span> {releaseDateLabel} (EUA)
                  </p>
                )}
                {comic.writer && (
                  <p className="line-clamp-1">
                    <span className="text-white/50">Autores:</span> {comic.writer}
                  </p>
                )}
                {comic.artists && (
                  <p className="line-clamp-1">
                    <span className="text-white/50">Artistas:</span> {comic.artists}
                  </p>
                )}
              </div>

              {downloadUrl && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={`/ler/${comic.id}`}
                    tabIndex={drawerTabIndex}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    Ler online
                  </a>
                  <a
                    href={downloadUrl}
                    download
                    tabIndex={drawerTabIndex}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
