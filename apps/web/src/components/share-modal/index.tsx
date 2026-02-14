"use client"

import { createPortal } from "react-dom"
import { useShareModal } from "./share-modal.hook"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
}

const ACCENT_COLOR = "var(--color-dc-blue)"

export function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const { copyStatus, shareWhatsApp, copyLink } = useShareModal(url, isOpen)

  if (!isOpen || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm animate-fade-in-up"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation()
            onClose()
          }
        }}
      >
        <div
          className="absolute -inset-[2px] rounded-2xl opacity-80 animate-border-glow"
          style={{
            background: `linear-gradient(135deg, ${ACCENT_COLOR}, transparent 40%, transparent 60%, ${ACCENT_COLOR})`,
            backgroundSize: "200% 200%",
          }}
        />

        <div
          className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
          style={{ backgroundColor: ACCENT_COLOR }}
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
              background: `radial-gradient(ellipse at top left, ${ACCENT_COLOR} 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${ACCENT_COLOR} 0%, transparent 50%)`,
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

            <div className="mb-6">
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="h-px w-8 transition-colors duration-300"
                  style={{ backgroundColor: ACCENT_COLOR }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: ACCENT_COLOR }}
                >
                  Compartilhar
                </span>
              </div>

              <h3 className="mb-2 text-2xl font-black uppercase tracking-wide text-white">
                Compartilhar card
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Compartilhe seu card de perfil com seus amigos.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-4 text-sm font-semibold uppercase tracking-widest text-green-300 transition-all duration-300 hover:border-green-500/50 hover:bg-green-500/20"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>

              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold uppercase tracking-widest text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {copyStatus === "copied" ? "Link copiado!" : "Copiar link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
