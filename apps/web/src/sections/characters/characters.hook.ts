"use client"

import type { Character } from "@dc-absoluto/shared-types"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { type CharacterImages, getCharacterImages } from "@/constants/character-images"

export interface CharacterWithImages extends Character {
  images: CharacterImages
}

export function useCharacters(characters: Character[] | null) {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false)
  const [isStartingReading, setIsStartingReading] = useState(false)

  const charactersWithImages = useMemo(() => {
    if (!characters) return []
    return characters.map((character) => ({
      ...character,
      images: getCharacterImages(character.slug),
    }))
  }, [characters])

  const selectedCharacter = useMemo(() => {
    return charactersWithImages[selectedIndex] || null
  }, [charactersWithImages, selectedIndex])

  useEffect(() => {
    if (!selectedCharacter) return
    router.prefetch(`/${selectedCharacter.slug}`)
  }, [router, selectedCharacter])

  useEffect(() => {
    if (charactersWithImages.length === 0) return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const prefetchInOrder = () => {
      let index = 0

      const prefetchNext = () => {
        if (cancelled || index >= charactersWithImages.length) return
        const character = charactersWithImages[index]
        if (!character) return
        router.prefetch(`/${character.slug}`)
        index += 1
        timeoutId = setTimeout(prefetchNext, 100)
      }

      prefetchNext()
    }

    timeoutId = setTimeout(prefetchInOrder, 100)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [charactersWithImages, router])

  const handleSelectCharacter = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const handleStartReading = useCallback(() => {
    if (!selectedCharacter || isStartingReading) return
    setIsStartingReading(true)
    router.push(`/${selectedCharacter.slug}`)
  }, [selectedCharacter, isStartingReading, router])

  const handleOpenNewsletterModal = useCallback(() => {
    setIsNewsletterModalOpen(true)
  }, [])

  const handleCloseNewsletterModal = useCallback(() => {
    setIsNewsletterModalOpen(false)
  }, [])

  return {
    charactersWithImages,
    selectedCharacter,
    selectedIndex,
    handleSelectCharacter,
    handleStartReading,
    isStartingReading,
    isNewsletterModalOpen,
    handleOpenNewsletterModal,
    handleCloseNewsletterModal,
  }
}
