"use client"

import { useCallback, useEffect, useState } from "react"
import { PUBLIC_API_URL } from "@/lib/env/public"

const API_URL = PUBLIC_API_URL

interface UseNewsletterOptions {
  prefilledEmail?: string | null
}

export function useNewsletter({ prefilledEmail }: UseNewsletterOptions = {}) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false)
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false)

  useEffect(() => {
    if (!prefilledEmail) return
    setEmail(prefilledEmail)
    setStatus("idle")
    setMessage("")
  }, [prefilledEmail])

  useEffect(() => {
    if (!prefilledEmail) {
      setIsCheckingSubscription(false)
      setIsAlreadySubscribed(false)
      return
    }

    let isActive = true

    const checkSubscription = async () => {
      setIsCheckingSubscription(true)
      setIsAlreadySubscribed(false)

      try {
        const params = new URLSearchParams({ email: prefilledEmail })
        const response = await fetch(
          `${API_URL}/api/newsletter/subscription?${params.toString()}`,
        )
        const data = await response.json()

        if (response.ok && isActive) {
          setIsAlreadySubscribed(Boolean(data?.subscribed))
        }
      } catch {
        if (isActive) {
          setIsAlreadySubscribed(false)
        }
      } finally {
        if (isActive) {
          setIsCheckingSubscription(false)
        }
      }
    }

    checkSubscription()

    return () => {
      isActive = false
    }
  }, [prefilledEmail])

  const handleSubmit = useCallback(async () => {
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
      } else {
        setStatus("error")
        setMessage(data.message ?? "Erro ao se inscrever")
      }
    } catch {
      setStatus("error")
      setMessage("Erro de conexão. Tente novamente.")
    }
  }, [email])

  const reset = useCallback(() => {
    setEmail("")
    setStatus("idle")
    setMessage("")
    setIsCheckingSubscription(false)
    setIsAlreadySubscribed(false)
  }, [])

  return {
    email,
    setEmail,
    status,
    message,
    isCheckingSubscription,
    isAlreadySubscribed,
    handleSubmit,
    reset,
  }
}
