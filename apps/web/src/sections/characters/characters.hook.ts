"use client"

import type { Character } from "@dc-absoluto/shared-types"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

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
