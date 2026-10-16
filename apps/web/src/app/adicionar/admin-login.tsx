"use client"

import { useId } from "react"

import { Button } from "@/components/button"
import { useAdminLogin } from "./admin-login.hook"

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors focus:border-dc-blue focus:ring-2 focus:ring-dc-blue/40"

export function AdminLogin() {
  const { email, setEmail, password, setPassword, status, message, handleSubmit, isLoading } =
    useAdminLogin()
  const emailId = useId()
  const passwordId = useId()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm leading-relaxed text-white/60">
        Área restrita. Entre com a conta de administrador. A sessão dura 30 minutos e nada fica
        salvo neste navegador.
      </p>

      <div className="space-y-1.5">
        <label htmlFor={emailId} className="block text-sm font-semibold text-white/80">
          E-mail
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={passwordId} className="block text-sm font-semibold text-white/80">
          Senha
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClassName}
        />
      </div>

      {status === "error" && message && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}
