"use client"

import { useCallback, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

export function useNewsletterModal(characterId: string | null) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = useCallback(async () => {
    if (!email || !characterId) return

    setStatus("loading")

    try {
      const response = await fetch(`${API_URL}/api/newsletter/character/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, characterId }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message)
      } else {
        setStatus("error")
        setMessage(data.message ?? "Erro ao se inscrever")
      }
    } catch {
      setStatus("error")
      setMessage("Erro de conexão. Tente novamente.")
    }
  }, [email, characterId])

  const reset = useCallback(() => {
    setEmail("")
    setStatus("idle")
    setMessage("")
  }, [])

  return { email, setEmail, status, message, handleSubmit, reset }
}
