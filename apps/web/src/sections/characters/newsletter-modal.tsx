"use client"

import { useId } from "react"

import { useNewsletterModal } from "./newsletter-modal.hook"

interface NewsletterModalProps {
  isOpen: boolean
  onClose: () => void
  characterId: string
  characterName: string
  accentColor: string
}

export function NewsletterModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  accentColor,
}: NewsletterModalProps) {
  const { email, setEmail, status, message, handleSubmit, reset } = useNewsletterModal(characterId)
  const titleId = useId()
  const descriptionId = useId()
  const emailId = useId()

  if (!isOpen) return null
  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={handleClose}
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
            handleClose()
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
          className="relative rounded-2xl p-8 overflow-hidden"
          style={{
            background: `linear-gradient(160deg, rgba(10,10,26,0.97) 0%, rgba(10,10,26,0.99) 50%, rgba(10,10,26,0.97) 100%)`,
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
              onClick={handleClose}
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
                Newsletter
              </span>
            </div>

            <h3 id={titleId} className="mb-2 text-2xl font-black uppercase tracking-wide text-white">
              Receba novidades
            </h3>
            <p id={descriptionId} className="mb-6 text-sm leading-relaxed text-gray-400">
              Seja o primeiro a saber quando uma nova HQ de{" "}
              <strong className="font-semibold text-white">{characterName}</strong> for adicionada
              ao catálogo.
            </p>

            {status === "success" ? (
              <div
                role="status"
                className="rounded-xl border-l-4 p-5"
                style={{
                  borderColor: accentColor,
                  background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
                }}
              >
                <p className="font-semibold text-white">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="group relative">
                  <label htmlFor={emailId} className="sr-only">
                    E-mail
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
                    style={
                      {
                        "--tw-ring-color": accentColor,
                      } as React.CSSProperties
                    }
                  />
                </div>

                {status === "error" && (
                  <p role="alert" className="text-sm text-red-400">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-xl py-4 font-bold uppercase tracking-wider text-white transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                    boxShadow: `0 4px 24px ${accentColor}40`,
                  }}
                >
                  <span className="relative z-10">
                    {status === "loading" ? "Inscrevendo..." : "Quero ser avisado"}
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor})`,
                    }}
                  />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
