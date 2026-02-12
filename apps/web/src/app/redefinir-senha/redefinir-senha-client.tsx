"use client"

import { PUBLIC_API_URL } from "@/lib/env/public"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useState } from "react"

type ResetStatus = "idle" | "loading" | "success" | "expired" | "invalid" | "error" | "missing"

const PASSWORD_PATTERN = "^(?=.*\\d).{6,}$"
const passwordRegex = new RegExp(PASSWORD_PATTERN)
const REDIRECT_DELAY_SECONDS = 5

export default function RedefinirSenhaClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const newPasswordId = useId()
  const confirmPasswordId = useId()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const [status, setStatus] = useState<ResetStatus>(token ? "idle" : "missing")
  const [message, setMessage] = useState(token ? "" : "Link de redefinição inválido.")
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_SECONDS)

  const isLoading = status === "loading"

  useEffect(() => {
    if (status !== "success") return

    setSecondsLeft(REDIRECT_DELAY_SECONDS)

    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)

    const timeout = setTimeout(() => {
      router.push("/")
    }, REDIRECT_DELAY_SECONDS * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router, status])

  const validate = () => {
    if (!passwordRegex.test(newPassword)) {
      return "A senha precisa ter no mínimo 6 caracteres e 1 número."
    }

    if (newPassword !== confirmPassword) {
      return "As senhas não coincidem."
    }

    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const error = validate()

    if (error) {
      setStatus("error")
      setMessage(error)
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch(`${PUBLIC_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setStatus("success")
        setMessage(data.message ?? "Senha redefinida com sucesso.")
        return
      }

      if (response.status === 410) {
        setStatus("expired")
        setMessage(data.message ?? "Este link expirou. Solicite um novo link.")
        return
      }

      if (response.status === 404) {
        setStatus("invalid")
        setMessage(data.message ?? "Link inválido ou já utilizado.")
        return
      }

      setStatus("error")
      setMessage(data.message ?? "Não foi possível redefinir a senha.")
    } catch {
      setStatus("error")
      setMessage("Erro de conexão. Tente novamente.")
    }
  }

  const isFormDisabled =
    status === "success" || status === "expired" || status === "invalid" || status === "missing"

  return (
    <div className="min-h-svh bg-dc-black text-white">
      <main className="flex min-h-svh items-center justify-center px-6 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(30,64,175,0.15)] backdrop-blur">
          <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            <span className="h-px w-10 bg-gradient-to-r from-blue-500 via-blue-400 to-transparent" />
            Redefinir
          </div>

          <h1 className="text-2xl font-black uppercase tracking-wide">Senha</h1>

          {isFormDisabled ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{message}</p>

              {status === "success" && (
                <p className="mt-4 text-sm text-emerald-300">
                  Redirecionando para a página inicial em {secondsLeft}s.
                </p>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="group relative">
                <label htmlFor={newPasswordId} className="sr-only">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id={newPasswordId}
                    type={isNewPasswordVisible ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                    required
                    minLength={6}
                    pattern={PASSWORD_PATTERN}
                    autoComplete="new-password"
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
                    style={
                      {
                        "--tw-ring-color": "var(--color-dc-blue)",
                      } as React.CSSProperties
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setIsNewPasswordVisible((current) => !current)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white/60 transition-colors hover:text-white"
                    aria-label={isNewPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {isNewPasswordVisible ? (
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
                <p className="mt-2 text-xs text-gray-500">
                  Senha com no mínimo 6 caracteres e 1 número.
                </p>
              </div>

              <div className="group relative">
                <label htmlFor={confirmPasswordId} className="sr-only">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input
                    id={confirmPasswordId}
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar nova senha"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
                    style={
                      {
                        "--tw-ring-color": "var(--color-dc-blue)",
                      } as React.CSSProperties
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible((current) => !current)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white/60 transition-colors hover:text-white"
                    aria-label={isConfirmPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {isConfirmPasswordVisible ? (
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
              </div>

              {status === "error" && (
                <p role="alert" className="text-sm text-red-400">
                  {message}
                </p>
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
                  {isLoading ? "Redefinindo..." : "Redefinir senha"}
                </span>
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white/20"
            >
              Ir para a home
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
