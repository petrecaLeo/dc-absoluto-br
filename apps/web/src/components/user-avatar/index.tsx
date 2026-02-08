"use client"

import Image from "next/image"

import { useUserAvatar, type UserAvatarSize } from "./user-avatar.hook"

interface UserAvatarProps {
  name: string
  profileImage?: string | null
  size?: UserAvatarSize
  className?: string
}

export function UserAvatar({ name, profileImage, size = "md", className = "" }: UserAvatarProps) {
  const { initial, imageSrc, sizeClass, textClass, dimension, sizes, useOriginal } = useUserAvatar({
    name,
    profileImage,
    size,
  })

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-white ${sizeClass} ${className}`.trim()}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`Foto de ${name}`}
          width={dimension}
          height={dimension}
          sizes={sizes}
          quality={90}
          unoptimized={useOriginal}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={`font-semibold ${textClass}`}>{initial}</span>
      )}
    </div>
  )
}
