"use client"

import { useCallback, useEffect, useState } from "react"

export type CopyStatus = "idle" | "copied"

export function useShareModal(url: string, isOpen: boolean) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")

  useEffect(() => {
    if (!isOpen) {
      setCopyStatus("idle")
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return
    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior
    const previousHtmlScrollSnapType = document.documentElement.style.scrollSnapType
    const previousBodyScrollBehavior = document.body.style.scrollBehavior
    const previousBodyScrollSnapType = document.body.style.scrollSnapType

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    document.documentElement.style.overflow = "hidden"
    document.documentElement.style.scrollBehavior = "auto"
    document.documentElement.style.scrollSnapType = "none"
    document.body.style.scrollBehavior = "auto"
    document.body.style.scrollSnapType = "none"

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.scrollBehavior = "auto"
      document.documentElement.style.scrollSnapType = previousHtmlScrollSnapType
      document.body.style.scrollBehavior = previousBodyScrollBehavior
      document.body.style.scrollSnapType = previousBodyScrollSnapType
      window.scrollTo(0, scrollY)
      document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior
    }
  }, [isOpen])

  const shareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`Confira meu card de perfil no DC Absoluto BR! ${url}`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
  }, [url])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus("copied")
      setTimeout(() => setCopyStatus("idle"), 2000)
    } catch {
      setCopyStatus("idle")
    }
  }, [url])

  return {
    copyStatus,
    shareWhatsApp,
    copyLink,
  }
}
