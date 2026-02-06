"use client"

import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import type { AuthUser } from "./auth.types"
import { useLoginModal } from "./login-modal.hook"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: AuthUser) => void
  accentColor?: string
}

export function LoginModal({
  isOpen,
  onClose,
  onAuthSuccess,
  accentColor = "var(--color-dc-blue)",
}: LoginModalProps) {
  const {
    mode,
    setMode,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    status,
    message,
    submit,
    resendVerification,
    reset,
    emailPattern,
    passwordPattern,
  } = useLoginModal()

  const titleId = useId()
  const descriptionId = useId()
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isLoading = status === "loading"

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return
    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior
    const previousHtmlScrollSnapType = document.documentElement.style.scrollSnapType
    const previousBodyScrollBehavior = document.body.style.scrollBehavior
    const previousBodyScrollSnapType = document.body.style.scrollSnapType

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    document.documentElement.style.overflow = "hidden"
    document.documentElement.style.scrollBehavior = "auto"
    document.documentElement.style.scrollSnapType = "none"
    document.body.style.scrollBehavior = "auto"
    document.body.style.scrollSnapType = "none"

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.scrollBehavior = "auto"
      document.documentElement.style.scrollSnapType = previousHtmlScrollSnapType
      document.body.style.scrollBehavior = previousBodyScrollBehavior
      document.body.style.scrollSnapType = previousBodyScrollSnapType
      window.scrollTo(0, scrollY)
      document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior
    }
  }, [isOpen])

  useEffect(() => {
    setIsPasswordVisible(false)
  }, [isOpen, mode])

  if (!isOpen) return null
  if (typeof document === "undefined") return null

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = await submit()
    if (user) {
      onAuthSuccess(user)
      handleClose()
    }
  }

  return createPortal(
    <div
      data-fullpage-ignore
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
    >
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
              onClick={handleClose}
              className="absolute -top-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 transition-colors hover:border-white/30 hover:text-white"
              aria-label="Fechar"
            >
              ✕
            </button>

            <div className="mb-4">
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="h-px w-8 transition-colors duration-300"
                  style={{ backgroundColor: accentColor }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: accentColor }}
                >
                  Conta
                </span>
              </div>

              <h3
                id={titleId}
                className="mb-2 text-2xl font-black uppercase tracking-wide text-white"
              >
                {mode === "signup" ? "Criar conta" : "Entrar"}
              </h3>
              <p id={descriptionId} className="text-sm leading-relaxed text-gray-400">
                {mode === "signup"
                  ? "Crie uma conta para personalizar sua experiência."
                  : "Entre para não perder nenhuma novidade!"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="group relative">
                  <label htmlFor={nameId} className="sr-only">
                    Nome
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    minLength={2}
                    autoComplete="name"
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
                    style={
                      {
                        "--tw-ring-color": accentColor,
                      } as React.CSSProperties
                    }
                  />
                </div>
              )}

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
                  pattern={emailPattern}
                  autoFocus={mode === "login"}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
                  style={
                    {
                      "--tw-ring-color": accentColor,
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="group">
                <label htmlFor={passwordId} className="sr-only">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id={passwordId}
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                    minLength={6}
                    pattern={passwordPattern}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
                    style={
                      {
                        "--tw-ring-color": accentColor,
                      } as React.CSSProperties
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white/60 transition-colors hover:text-white"
                    aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {isPasswordVisible ? (
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M4 4l16 16" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {mode === "signup" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Senha com no mínimo 6 caracteres e 1 número.
                  </p>
                )}
              </div>

              {status === "error" && (
                <p role="alert" className="text-sm text-red-400">
                  {message}
                </p>
              )}

              {status === "success" && message && (
                <p role="status" className="text-sm text-emerald-300">
                  {message}
                </p>
              )}

              {mode === "signup" && status === "success" && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={isLoading}
                  className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-white/60 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-50"
                >
                  Reenviar confirmação de e-mail
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="animate-btn-glow animate-btn-glow-report w-full cursor-pointer rounded-xl px-8 py-4 text-sm font-black tracking-widest text-white uppercase transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 42%, #dc2626 75%, #facc15 100%)",
                }}
              >
                <span className="relative z-10">
                  {status === "loading"
                    ? mode === "signup"
                      ? "Criando..."
                      : "Entrando..."
                    : mode === "signup"
                      ? "Criar conta"
                      : "Entrar"}
                </span>
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-white/60">
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="cursor-pointer font-semibold text-white/80 transition-colors hover:text-white"
                >
                  Não tem conta? Criar agora
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="cursor-pointer font-semibold text-white/80 transition-colors hover:text-white"
                >
                  Já tem conta? Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
