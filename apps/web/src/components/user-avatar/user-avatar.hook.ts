"use client"

import { useMemo } from "react"

export type UserAvatarSize = "sm" | "md" | "lg"

interface UseUserAvatarProps {
  name: string
  profileImage?: string | null
  size?: UserAvatarSize
}

const sizeClasses: Record<
  UserAvatarSize,
  { wrapper: string; text: string; dimension: number; sizes: string }
> = {
  sm: { wrapper: "h-8 w-8", text: "text-xs", dimension: 64, sizes: "32px" },
  md: { wrapper: "h-10 w-10", text: "text-sm", dimension: 96, sizes: "48px" },
  lg: { wrapper: "h-16 w-16", text: "text-2xl", dimension: 200, sizes: "64px" },
}

export function useUserAvatar({ name, profileImage, size = "md" }: UseUserAvatarProps) {
  return useMemo(() => {
    const normalizedName = name.trim()
    const initial = normalizedName ? normalizedName[0]?.toUpperCase() ?? "?" : "?"
    const normalizedImage = profileImage?.trim() ?? ""
    const imageSrc = normalizedImage ? `/images/profile/${normalizedImage}.webp` : null
    const sizeConfig = sizeClasses[size] ?? sizeClasses.md

    return {
      initial,
      imageSrc,
      sizeClass: sizeConfig.wrapper,
      textClass: sizeConfig.text,
      dimension: sizeConfig.dimension,
      sizes: sizeConfig.sizes,
      useOriginal: size === "lg",
    }
  }, [name, profileImage, size])
}
