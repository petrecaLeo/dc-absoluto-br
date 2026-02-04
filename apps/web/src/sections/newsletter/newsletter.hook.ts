"use client"

import { useCallback, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

export function useNewsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!email.trim()) {
        setStatus("error")
        setMessage("Por favor, insira seu e-mail")
        return
      }

      setStatus("loading")

      try {
        const response = await fetch(`${API_URL}/api/newsletter/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage(data.message)
          setEmail("")
        } else {
          setStatus("error")
          setMessage(data.message ?? "Erro ao se inscrever")
        }
      } catch {
        setStatus("error")
        setMessage("Erro de conexão. Tente novamente.")
      }
    },
    [email],
  )

  const reset = useCallback(() => {
    setEmail("")
    setStatus("idle")
    setMessage("")
  }, [])

  return { email, setEmail, status, message, handleSubmit, reset }
}
