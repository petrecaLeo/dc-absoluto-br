"use client"

import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { DEFAULT_COMIC_UNIVERSE } from "@dc-absoluto/shared-types"

import { subscribeAuthChanges } from "@/components/header/auth.storage"
import type { AuthUser } from "@/components/header/auth.types"
import { PUBLIC_SITE_URL } from "@/lib/env/public"
import { getCurrentLevel } from "@/lib/levels"
import { getReadComicsCount, getTopCharacters } from "@/services/read-comics.client"

const TOP_CHARACTERS_STALE_TIME = 1000 * 60 * 5

export function usePerfilCardIdentidade(initialAuthUser: AuthUser) {
  const [authUser, setAuthUser] = useState<AuthUser>(initialAuthUser)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    setAuthUser(initialAuthUser)
  }, [initialAuthUser])

  useEffect(() => {
    const unsubscribe = subscribeAuthChanges((user) => {
      if (!user) return
      setAuthUser(user)
    })
    return () => unsubscribe()
  }, [])

  const { data: countData, isLoading: isCountLoading } = useQuery({
    queryKey: ["read-comics-count", DEFAULT_COMIC_UNIVERSE],
    queryFn: () => getReadComicsCount(DEFAULT_COMIC_UNIVERSE),
  })

  const { data: topData, isLoading: isTopLoading } = useQuery({
    queryKey: ["top-characters"],
    queryFn: getTopCharacters,
    staleTime: TOP_CHARACTERS_STALE_TIME,
    gcTime: TOP_CHARACTERS_STALE_TIME,
  })

  const count = countData?.data?.count ?? 0
  const currentLevel = getCurrentLevel(count)
  const isLoading = isCountLoading || isTopLoading

  const topCharacters = topData?.data ?? []
  const maxCount = topCharacters.length > 0 ? (topCharacters[0]?.count ?? 0) : 0
  const topCharacterNames = topCharacters
    .filter((c) => c.count === maxCount)
    .map((c) => c.characterName)

  const cardUrl = `${PUBLIC_SITE_URL}/card/${authUser.id}`

  const openCardInNewTab = useCallback(() => {
    window.open(cardUrl, "_blank", "noopener,noreferrer")
  }, [cardUrl])

  const openShareModal = useCallback(() => {
    setIsShareModalOpen(true)
  }, [])

  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false)
  }, [])

  const userCreatedAt = topData?.userCreatedAt ?? null
  const joinDate = userCreatedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(userCreatedAt))
    : null

  return {
    authUser,
    count,
    currentLevel,
    isLoading,
    topCharacterNames,
    joinDate,
    cardUrl,
    openCardInNewTab,
    isShareModalOpen,
    openShareModal,
    closeShareModal,
  }
}
