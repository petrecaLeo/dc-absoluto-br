export const LEVELS = [
  { key: "bronze", label: "Bronze", min: 10, image: "/images/levels/bronze.png" },
  { key: "prata", label: "Prata", min: 30, image: "/images/levels/silver.png" },
  { key: "ouro", label: "Ouro", min: 50, image: "/images/levels/gold.png" },
  { key: "diamante", label: "Diamante", min: 70, image: "/images/levels/diamond.png" },
  { key: "kryptonita", label: "Kryptonita", min: 100, image: "/images/levels/kryptonite.png" },
  { key: "absoluto", label: "Absoluto", min: 150, image: "/images/levels/absolute.png" },
] as const

export type Level = (typeof LEVELS)[number]

export const LEVEL_STYLES: Record<
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
  kryptonita: {
    card: "border-green-500/60 bg-green-900/40",
    dot: "bg-green-500",
    text: "text-green-100",
    border: "border-green-500/60",
  },
  absoluto: {
    card: "border-red-600/60 bg-red-900/40",
    dot: "bg-red-600",
    text: "text-red-100",
    border: "border-red-600/60",
  },
}

export function getCurrentLevel(count: number): Level | null {
  let current: Level | null = null
  for (const level of LEVELS) {
    if (count >= level.min) {
      current = level
    }
  }
  return current
}
