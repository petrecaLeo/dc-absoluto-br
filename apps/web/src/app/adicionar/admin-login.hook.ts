"use client"

import { useRouter } from "next/navigation"
import { type FormEvent, useCallback, useState, useTransition } from "react"

export function useAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isRefreshing, startRefresh] = useTransition()

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (status === "loading") return

      setStatus("loading")
      setMessage("")

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        })
        // A senha só vive no estado deste formulário: sai da memória assim que é enviada.
        setPassword("")
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          setStatus("error")
          setMessage(typeof data.message === "string" ? data.message : "Não foi possível entrar.")
          return
        }

        // O servidor passa a enxergar a sessão e troca o login pelo formulário. A transição
        // segura o "Entrando..." só até a página recarregar, sem prender o botão para sempre.
        setStatus("idle")
        startRefresh(() => router.refresh())
      } catch {
        setPassword("")
        setStatus("error")
        setMessage("Erro de conexão. Tente novamente.")
      }
    },
    [email, password, router, status],
  )

  return {
    email,
    setEmail,
    password,
    setPassword,
    status,
    message,
    handleSubmit,
    isLoading: status === "loading" || isRefreshing,
  }
}
