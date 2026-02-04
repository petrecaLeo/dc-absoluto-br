"use client"

import { getCharacterImages } from "@/constants/character-images"
import type { Character } from "@dc-absoluto/shared-types"
import { useState } from "react"

export function useCharacterCard(character: Character) {
  const [imageError, setImageError] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const images = getCharacterImages(character.slug)

  const hasValidImage = !imageError && images.image !== "/images/characters/default/character.webp"
  const hasValidLogo = !logoError && images.logo !== "/images/characters/default/logo.webp"

  const handleImageError = () => setImageError(true)
  const handleLogoError = () => setLogoError(true)

  const ratingStars = [1, 2, 3, 4, 5].map((star) => ({
    star,
    isFilled: star <= Math.round(character.rating),
  }))

  return {
    images,
    hasValidImage,
    hasValidLogo,
    handleImageError,
    handleLogoError,
    ratingStars,
  }
}
