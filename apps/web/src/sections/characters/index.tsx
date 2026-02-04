import { getCharacters } from "@/services/characters"
import { CharacterSelector } from "./character-selector"
import { CharactersClientFallback } from "./characters-client"

export default async function Characters() {
  let characters = null
  let hasError = false

  try {
    const response = await getCharacters()
    characters = response.data
  } catch {
    hasError = true
  }

  return (
    <section
      id="characters"
      aria-labelledby="characters-heading"
      tabIndex={-1}
      className="relative overflow-hidden bg-dc-dark"
    >
      {hasError ? (
        <div className="flex h-svh items-center justify-center px-4">
          <CharactersClientFallback />
        </div>
      ) : characters && characters.length === 0 ? (
        <div className="flex h-svh items-center justify-center">
          <EmptyState />
        </div>
      ) : characters ? (
        <CharacterSelector characters={characters} />
      ) : null}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-700">
        <svg
          className="h-12 w-12 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <p className="text-xl text-gray-300">Nenhum personagem cadastrado ainda.</p>
      <p className="mt-2 text-sm text-gray-500">
        Os personagens aparecerão aqui quando forem adicionados.
      </p>
    </div>
  )
}
