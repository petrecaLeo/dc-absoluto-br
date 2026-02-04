"use client"

import { useId } from "react"

interface ResumeReadingModalProps {
  isOpen: boolean
  comicTitle: string
  page: number
  totalPages: number
  onResume: () => void
  onStartOver: () => void
  onClose: () => void
  accentColor?: string
}

export function ResumeReadingModal({
  isOpen,
  comicTitle,
  page,
  totalPages,
  onResume,
  onStartOver,
  onClose,
  accentColor = "var(--color-dc-blue)",
}: ResumeReadingModalProps) {
  if (!isOpen) return null

  const titleId = useId()
  const descriptionId = useId()
  const pageLabel = `${page + 1}`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md animate-fade-in-up"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        <div
          className="absolute -inset-[2px] rounded-2xl opacity-80 animate-border-glow"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, transparent 40%, transparent 60%, ${accentColor})`,
            backgroundSize: "200% 200%",
          }}
        />

        <div
          className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
          style={{ backgroundColor: accentColor }}
        />

        <div
          className="relative overflow-hidden rounded-2xl p-8"
          style={{
            background:
              "linear-gradient(160deg, rgba(10,10,26,0.97) 0%, rgba(10,10,26,0.99) 50%, rgba(10,10,26,0.97) 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `radial-gradient(ellipse at top left, ${accentColor} 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${accentColor} 0%, transparent 50%)`,
            }}
          />

          <div className="relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 transition-colors hover:border-white/30 hover:text-white"
              aria-label="Fechar"
            >
              ✕
            </button>

            <div className="mb-1 flex items-center gap-3">
              <div
                className="h-px w-8 transition-colors duration-300"
                style={{ backgroundColor: accentColor }}
              />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                Retomar leitura
              </span>
            </div>

            <h3 id={titleId} className="mb-2 text-2xl font-black uppercase tracking-wide text-white">
              {comicTitle}
            </h3>
            <p id={descriptionId} className="mb-6 text-sm leading-relaxed text-gray-400">
              Você parou a leitura dessa HQ na página {pageLabel} de {totalPages}. Deseja retomar de
              onde parou?
            </p>

            <div
              className="mb-6 rounded-xl border-l-4 px-5 py-4"
              style={{
                borderColor: accentColor,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              }}
            >
              <p className="text-sm text-white/80">
                Última página lida: <strong className="text-white">{pageLabel}</strong>
              </p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={onResume}
                autoFocus
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 py-4 text-sm font-bold uppercase tracking-wider text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Retomar leitura
              </button>

              <button
                type="button"
                onClick={onStartOver}
                className="group relative w-full cursor-pointer overflow-hidden rounded-xl py-4 font-bold uppercase tracking-wider text-white transition-all duration-300 hover:shadow-lg text-sm"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                  boxShadow: `0 4px 24px ${accentColor}40`,
                }}
              >
                <span className="relative z-10">Começar do zero</span>
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor})`,
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
