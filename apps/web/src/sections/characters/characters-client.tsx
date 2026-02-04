"use client"

import { CharacterCard } from "./character-card"
import { useCharactersClient } from "./characters-client.hook"

export function CharactersClientFallback() {
  const { queryState, data, errorMessage, handleRetry, totalLabel } = useCharactersClient()

  if (queryState === "initial") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dc-red/50 bg-dc-red/10">
          <svg
            className="h-10 w-10 text-dc-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="mb-2 text-lg font-medium text-white">
          Não foi possível carregar os personagens
        </p>
        <p className="mb-6 text-sm text-gray-500">Ocorreu um erro na conexão com o servidor</p>
        <button
          type="button"
          onClick={handleRetry}
          className="group relative overflow-hidden rounded-lg bg-dc-gold px-8 py-3 font-bold text-dc-dark transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-dc-gold/25"
        >
          <span className="relative z-10">Tentar novamente</span>
          <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-300 group-hover:translate-x-full" />
        </button>
      </div>
    )
  }

  if (queryState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-dc-gold/20 border-t-dc-gold" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-dc-gold/10" />
          </div>
        </div>
        <p className="text-lg font-medium text-white">Carregando personagens...</p>
        <p className="mt-2 text-sm text-gray-500">Buscando dados do servidor</p>
      </div>
    )
  }

  if (queryState === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dc-red/50 bg-dc-red/10">
          <svg
            className="h-10 w-10 text-dc-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <p className="mb-2 text-lg font-medium text-white">Erro ao carregar personagens</p>
        <p className="mb-6 max-w-md text-center text-sm text-gray-500">{errorMessage}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="group relative overflow-hidden rounded-lg bg-dc-gold px-8 py-3 font-bold text-dc-dark transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-dc-gold/25"
        >
          <span className="relative z-10">Tentar novamente</span>
          <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-300 group-hover:translate-x-full" />
        </button>
      </div>
    )
  }

  if (queryState === "empty") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-xl text-gray-400">Nenhum personagem cadastrado ainda.</p>
        <p className="mt-2 text-sm text-gray-600">
          Os personagens aparecerão aqui quando forem adicionados.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-12 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-dc-gold/30 bg-dc-gold/10 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-dc-gold" />
          <span className="text-sm font-medium text-dc-gold">{totalLabel}</span>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((character, index) => (
          <CharacterCard key={character.id} character={character} index={index} />
        ))}
      </ul>
    </>
  )
}
