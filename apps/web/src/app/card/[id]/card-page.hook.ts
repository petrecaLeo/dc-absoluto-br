"use client"

import { useQuery } from "@tanstack/react-query"
import { useCallback, useState } from "react"

import { getCurrentLevel } from "@/lib/levels"
import { getUserProfile } from "@/services/users.client"

export type CopyStatus = "idle" | "copied"

export function useCardPage(userId: string) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => getUserProfile(userId),
  })

  const profile = data?.data ?? null
  const currentLevel = profile ? getCurrentLevel(profile.readCount) : null

  const joinDate = profile?.createdAt
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(profile.createdAt))
    : null

  const pageUrl = typeof window !== "undefined" ? window.location.href : ""

  const shareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`Confira meu card de perfil no DC Absoluto BR! ${pageUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
  }, [pageUrl])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopyStatus("copied")
      setTimeout(() => setCopyStatus("idle"), 2000)
    } catch {
      setCopyStatus("idle")
    }
  }, [pageUrl])

  return {
    profile,
    currentLevel,
    joinDate,
    isLoading,
    isError,
    copyStatus,
    shareWhatsApp,
    copyLink,
  }
}
