"use client"

import type { Character } from "@dc-absoluto/shared-types"
import Image from "next/image"
import { useCharacterCard } from "./character-card.hook"

interface CharacterCardProps {
  character: Character
  index: number
}

export function CharacterCard({ character, index }: CharacterCardProps) {
  const { images, hasValidImage, hasValidLogo, handleImageError, handleLogoError, ratingStars } =
    useCharacterCard(character)

  return (
    <li
      className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02]"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div
        className="absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${images.gradientFrom} 0%, ${images.gradientTo} 100%)`,
        }}
      />

      <div
        className="absolute -inset-1 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${images.accentColor} 0%, transparent 100%)`,
        }}
      />

      <div className="relative z-10 flex h-[420px] flex-col">
        <div className="relative flex-1 overflow-hidden">
          {hasValidImage ? (
            <>
              <Image
                src={images.image}
                alt={character.name}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                onError={handleImageError}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div
                className="flex h-32 w-32 items-center justify-center rounded-full text-6xl font-bold text-white/20"
                style={{ backgroundColor: images.accentColor }}
              >
                {character.name.charAt(0)}
              </div>
            </div>
          )}

          {hasValidLogo && (
            <div className="absolute right-4 top-4 z-20 h-16 w-16 drop-shadow-2xl transition-transform duration-300 group-hover:scale-110">
              <Image
                src={images.logo}
                alt={`Logo ${character.name}`}
                fill
                className="object-contain"
                onError={handleLogoError}
              />
            </div>
          )}
        </div>

        <div className="relative bg-black/60 px-5 py-4 backdrop-blur-lg">
          <div
            className="mb-2 border-l-4 pl-3 transition-all duration-300 ease-out"
            style={{ borderColor: images.accentColor }}
          >
            <h3 className="text-2xl font-black uppercase tracking-wide text-white transition-all duration-300">
              {character.name}
            </h3>
            {character.alias && (
              <p
                className="text-sm font-medium italic transition-all duration-300"
                style={{ color: images.accentColor }}
              >
                {character.alias}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                  style={{ backgroundColor: images.accentColor }}
                >
                  <span className="text-white font-bold">{character.rating.toFixed(1)}</span>
                </div>
                <div className="flex">
                  {ratingStars.map(({ star, isFilled }) => (
                    <span
                      key={star}
                      className={`text-xs ${isFilled ? "text-dc-gold" : "text-gray-600"}`}
                    >
                      *
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span className="text-sm font-medium">{character.upvotes}</span>
              </div>
            </div>

            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: images.accentColor }}
            >
              Ver mais
            </button>
          </div>
        </div>
        <div
          className="absolute left-0 top-0 h-20 w-1 opacity-60"
          style={{ backgroundColor: images.accentColor }}
        />
        <div
          className="absolute left-0 top-0 h-1 w-20 opacity-60"
          style={{ backgroundColor: images.accentColor }}
        />
      </div>
    </li>
  )
}
