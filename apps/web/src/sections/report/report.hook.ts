"use client"

import { useCallback, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
const MAX_CHARACTERS = 2000

export function useReport() {
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [feedback, setFeedback] = useState("")

  const charactersLeft = MAX_CHARACTERS - message.length

  const handleMessageChange = useCallback((value: string) => {
    if (value.length <= MAX_CHARACTERS) {
      setMessage(value)
    }
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!message.trim()) {
        setStatus("error")
        setFeedback("Por favor, escreva sua mensagem antes de enviar.")
        return
      }

      setStatus("loading")

      try {
        const response = await fetch(`${API_URL}/api/report/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message.trim() }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setFeedback(data.message)
          setMessage("")
        } else {
          setStatus("error")
          setFeedback(data.message ?? "Erro ao enviar reporte.")
        }
      } catch {
        setStatus("error")
        setFeedback("Erro de conexão. Tente novamente.")
      }
    },
    [message],
  )

  return { message, handleMessageChange, status, feedback, handleSubmit, charactersLeft }
}
