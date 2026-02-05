"use client"

import { useCallback, useEffect, useState } from "react"
import { PUBLIC_API_URL } from "@/lib/env/public"

const API_URL = PUBLIC_API_URL

export function useNewsletterModal(
  characterId: string | null,
  initialEmail?: string | null,
  isOpen?: boolean,
) {
  const [email, setEmail] = useState(initialEmail ?? "")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false)
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (!initialEmail) return
    setEmail(initialEmail)
  }, [initialEmail, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!initialEmail || !characterId) return

    let isActive = true

    const checkSubscription = async () => {
      setIsCheckingSubscription(true)
      setIsAlreadySubscribed(false)

      try {
        const params = new URLSearchParams({
          email: initialEmail,
          characterId,
        })
        const response = await fetch(
          `${API_URL}/api/newsletter/character/subscription?${params.toString()}`,
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
  }, [characterId, initialEmail, isOpen])

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
