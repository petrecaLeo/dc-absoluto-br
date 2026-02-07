"use client"

import { useId, useState } from "react"

const PASSWORD_PATTERN = "^(?=.*\\d).{6,}$"
const passwordRegex = new RegExp(PASSWORD_PATTERN)

export function PerfilSenha() {
  const currentPasswordId = useId()
  const newPasswordId = useId()
  const confirmPasswordId = useId()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false)
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const isLoading = status === "loading"

  const resetFeedback = () => {
    if (status !== "idle") {
      setStatus("idle")
      setMessage("")
    }
  }

  const validate = () => {
    if (!currentPassword) {
      return "Digite sua senha atual."
    }

    if (!passwordRegex.test(newPassword)) {
      return "A nova senha precisa ter no mínimo 6 caracteres e 1 número."
    }

    if (newPassword === currentPassword) {
      return "A nova senha precisa ser diferente da senha atual."
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
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setStatus("success")
        setMessage(data.message ?? "Senha alterada com sucesso.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        return
      }

      setStatus("error")
      setMessage(data.message ?? "Não foi possível alterar a senha.")
    } catch {
      setStatus("error")
      setMessage("Erro de conexão. Tente novamente.")
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Senha</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Alterar senha</h2>
        </div>
        <p className="text-sm text-white/70">Mantenha seu acesso protegido.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="group relative">
          <label htmlFor={currentPasswordId} className="sr-only">
            Senha atual
          </label>
          <div className="relative">
            <input
              id={currentPasswordId}
              type={isCurrentPasswordVisible ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => {
                resetFeedback()
                setCurrentPassword(event.target.value)
              }}
              placeholder="Senha atual"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
              style={{
                "--tw-ring-color": "var(--color-dc-blue)",
              } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => setIsCurrentPasswordVisible((current) => !current)}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-white/60 transition-colors hover:text-white"
              aria-label={isCurrentPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            >
              {isCurrentPasswordVisible ? (
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

        <div className="group relative">
          <label htmlFor={newPasswordId} className="sr-only">
            Nova senha
          </label>
          <div className="relative">
            <input
              id={newPasswordId}
              type={isNewPasswordVisible ? "text" : "password"}
              value={newPassword}
              onChange={(event) => {
                resetFeedback()
                setNewPassword(event.target.value)
              }}
              placeholder="Nova senha"
              required
              minLength={6}
              pattern={PASSWORD_PATTERN}
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
              style={{
                "--tw-ring-color": "var(--color-dc-blue)",
              } as React.CSSProperties}
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
              onChange={(event) => {
                resetFeedback()
                setConfirmPassword(event.target.value)
              }}
              placeholder="Confirmar nova senha"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white placeholder-gray-600 outline-none transition-all duration-300 focus:border-transparent focus:ring-2"
              style={{
                "--tw-ring-color": "var(--color-dc-blue)",
              } as React.CSSProperties}
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

        {status === "success" && message && (
          <p role="status" className="text-sm text-emerald-300">
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
            {isLoading ? "Salvando..." : "Alterar senha"}
          </span>
        </button>
      </form>
    </section>
  )
}
