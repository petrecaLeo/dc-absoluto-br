"use client"

import { useQuery } from "@tanstack/react-query"

import { getReadComicsCount } from "@/services/read-comics.client"

const LEVELS = [
  { key: "bronze", label: "Bronze", min: 10 },
  { key: "prata", label: "Prata", min: 30 },
  { key: "ouro", label: "Ouro", min: 50 },
  { key: "diamante", label: "Diamante", min: 70 },
  { key: "absoluto", label: "Absoluto", min: 100 },
] as const

type Level = (typeof LEVELS)[number]

const LEVEL_STYLES: Record<
  Level["key"],
  { card: string; dot: string; text: string; border: string }
> = {
  bronze: {
    card: "border-amber-700/60 bg-amber-900/40",
    dot: "bg-amber-700",
    text: "text-amber-100",
    border: "border-amber-700/60",
  },
  prata: {
    card: "border-slate-400/60 bg-slate-700/40",
    dot: "bg-slate-400",
    text: "text-slate-100",
    border: "border-slate-400/60",
  },
  ouro: {
    card: "border-yellow-700/60 bg-yellow-900/40",
    dot: "bg-yellow-700",
    text: "text-yellow-100",
    border: "border-yellow-700/60",
  },
  diamante: {
    card: "border-purple-500/60 bg-purple-900/40",
    dot: "bg-purple-500",
    text: "text-purple-100",
    border: "border-purple-500/60",
  },
  absoluto: {
    card: "border-red-600/60 bg-red-900/40",
    dot: "bg-red-600",
    text: "text-red-100",
    border: "border-red-600/60",
  },
}

function getCurrentLevel(count: number): Level | null {
  let current: Level | null = null
  for (const level of LEVELS) {
    if (count >= level.min) {
      current = level
    }
  }
  return current
}

export function PerfilConquistas() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["read-comics-count"],
    queryFn: getReadComicsCount,
  })

  const count = data?.data?.count ?? 0
  const currentLevel = getCurrentLevel(count)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Conquistas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Nível atual</h2>
        </div>
        <div className="text-sm text-white">
          {isLoading
            ? "Carregando..."
            : `${count} ${count === 1 ? "HQ" : "HQs"} lida${count === 1 ? "" : "s"}`}
        </div>
      </div>

      <div className="mt-4">
        {isError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            Não foi possível carregar suas conquistas agora.
          </div>
        ) : isLoading ? (
          <div className="h-16 w-full animate-pulse rounded-xl border border-white/10 bg-white/10" />
        ) : currentLevel ? (
          <div className={`rounded-xl border px-4 py-3 ${LEVEL_STYLES[currentLevel.key].card}`}>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${LEVEL_STYLES[currentLevel.key].text}`}
            >
              {currentLevel.label}
            </p>
            <p className="mt-1 text-sm text-white/80">Continue lendo para subir de nível.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Você ainda não atingiu um nível. Leia 10 HQs para chegar ao Bronze.
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-white">Legenda</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEVELS.map((level) => {
            const isCurrent = currentLevel?.key === level.key
            return (
              <div
                key={level.key}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white ${
                  isCurrent
                    ? "bg-white/10"
                    : "text-white"
                } ${LEVEL_STYLES[level.key].border}`}
              >
                <span className={`h-2 w-2 rounded-full ${LEVEL_STYLES[level.key].dot}`} />
                <span>{level.label}</span>
                <span className="text-[0.75rem] font-semibold normal-case tracking-normal text-white/80">
                  {level.min} HQs
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
