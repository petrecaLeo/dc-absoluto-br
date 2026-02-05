"use client"

import type { Character } from "@dc-absoluto/shared-types"
import Image from "next/image"

import { type CharacterWithImages, useCharacters } from "./characters.hook"
import { NewsletterModal } from "./newsletter-modal"
import { ParticleEffect } from "./particle-effect"

interface CharacterSelectorProps {
  characters: Character[]
}

export function CharacterSelector({ characters }: CharacterSelectorProps) {
  const {
    charactersWithImages,
    selectedCharacter,
    selectedIndex,
    handleSelectCharacter,
    handleStartReading,
    isStartingReading,
    isNewsletterModalOpen,
    handleOpenNewsletterModal,
    handleCloseNewsletterModal,
  } = useCharacters(characters)

  return (
    <div className="relative h-svh w-full overflow-hidden">
      {charactersWithImages.map((character, index) => (
        <div
          key={`bg-${character.id}`}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === selectedIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: `linear-gradient(135deg, ${character.images.gradientFrom} 0%, ${character.images.gradientTo} 50%, #0a0a0a 100%)`,
          }}
        />
      ))}

      <div className="absolute inset-0">
        {charactersWithImages.map((character, index) => (
          <div
            key={character.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === selectedIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={character.images.image}
              alt={character.name}
              fill
              className={`object-cover object-center ${
                character.slug === "martian-manhunter"
                  ? "lg:object-bottom-right"
                  : "lg:object-top-right"
              }`}
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.5) 40%, transparent 60%)",
        }}
      />

      {selectedCharacter && (
        <>
          <ParticleEffect accentColor={selectedCharacter.images.accentColor} />
          <div
            className="absolute bottom-0 left-0 right-0 h-6 z-30 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, ${selectedCharacter.images.accentColor})`,
            }}
          />
        </>
      )}

      <div className="relative z-20 flex h-full flex-col justify-center px-8 lg:px-16 lg:w-[45%]">
        <div className="mb-8">
          <div id="characters-header" className="mb-4 flex items-center gap-3">
            <div
              className="h-px w-10 transition-colors duration-300"
              style={{
                backgroundColor: selectedCharacter?.images.accentColor ?? "var(--color-dc-blue)",
              }}
            />
            <div
              className="h-2 w-2 rotate-45 transition-colors duration-300"
              style={{
                backgroundColor: selectedCharacter?.images.accentColor ?? "var(--color-dc-blue)",
              }}
            />
          </div>

          <h2
            id="characters-heading"
            className="mb-2 text-4xl font-black uppercase tracking-wider text-white lg:text-5xl"
          >
            Personagens
          </h2>

          <p className="text-base text-gray-300 lg:text-lg">
            Selecione seu herói favorito para começar a ler
          </p>
        </div>

        {selectedCharacter && (
          <div className="mb-8">
            <div
              className="inline-block rounded-lg border-l-4 px-6 py-4 backdrop-blur-md transition-colors duration-300 ease-out"
              style={{
                borderColor: selectedCharacter.images.accentColor,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <div key={selectedCharacter.id} className="animate-fade-in-slide">
                <h3 className="text-3xl font-black uppercase tracking-wider text-white lg:text-4xl">
                  {selectedCharacter.name}
                </h3>
                {selectedCharacter.alias && (
                  <p className="mt-1 text-base text-gray-200 italic">{selectedCharacter.alias}</p>
                )}
                <button
                  type="button"
                  onClick={handleOpenNewsletterModal}
                  className="group mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-300 transition-colors duration-200 hover:text-white"
                >
                  <svg
                    className="h-4 w-4 transition-colors duration-200 group-hover:text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Ativar notificações
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="grid w-fit grid-cols-3 gap-4">
            {charactersWithImages.map((character, index) => (
              <CharacterSlot
                key={character.id}
                character={character}
                isSelected={index === selectedIndex}
                onClick={() => handleSelectCharacter(index)}
              />
            ))}
          </div>
        </div>

        {selectedCharacter && (
          <button
            type="button"
            onClick={handleStartReading}
            data-testid="start-reading-button"
            disabled={isStartingReading}
            aria-busy={isStartingReading}
            aria-disabled={isStartingReading}
            aria-label={
              isStartingReading
                ? `Carregando página de leitura de ${selectedCharacter.name}`
                : `Começar leitura com ${selectedCharacter.name}`
            }
            className="animate-btn-glow w-fit cursor-pointer rounded-xl px-14 py-3 text-lg font-black tracking-widest text-white uppercase transition-all duration-300 hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 disabled:cursor-wait"
            style={{
              backgroundImage: `linear-gradient(to right, ${selectedCharacter.images.gradientFrom}, ${selectedCharacter.images.gradientTo}, #000)`,
              backgroundSize: "200% 200%",
            }}
          >
            {isStartingReading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Carregando...
              </span>
            ) : (
              "Começar Leitura"
            )}
          </button>
        )}
        {selectedCharacter && (
          <span className="sr-only" role="status" aria-live="polite">
            {isStartingReading
              ? `Carregando página de leitura de ${selectedCharacter.name}`
              : null}
          </span>
        )}
      </div>

      {selectedCharacter && (
        <NewsletterModal
          isOpen={isNewsletterModalOpen}
          onClose={handleCloseNewsletterModal}
          characterId={selectedCharacter.id}
          characterName={selectedCharacter.name}
          accentColor={selectedCharacter.images.accentColor}
        />
      )}
    </div>
  )
}

interface CharacterSlotProps {
  character: CharacterWithImages
  isSelected: boolean
  onClick: () => void
}

function CharacterSlot({ character, isSelected, onClick }: CharacterSlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative cursor-pointer"
      aria-label={`Selecionar ${character.name}`}
      aria-pressed={isSelected}
    >
      {isSelected && (
        <div
          className="absolute -inset-2 rounded-xl blur-lg"
          style={{ backgroundColor: character.images.accentColor }}
        />
      )}

      <div
        className={`relative h-20 w-20 overflow-hidden rounded-xl border-3 transition-all duration-300 lg:h-24 lg:w-24 ${
          isSelected ? "" : "border-white/30 hover:border-white/60"
        }`}
        style={{
          borderColor: isSelected ? character.images.accentColor : undefined,
        }}
      >
        <Image
          src={character.images.logo}
          alt={character.name}
          fill
          className={`object-cover ${["green-lantern", "flash"].includes(character.slug) ? "object-[50%_50%]" : "object-[50%_43%]"} transition-all duration-300 ${
            isSelected ? "brightness-110" : "brightness-75 group-hover:brightness-100"
          }`}
        />

        {!isSelected && (
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-300" />
        )}
      </div>
    </button>
  )
}
