"use client"

import { getCharactersClient } from "@/services/characters.client"
import { useQuery } from "@tanstack/react-query"

type QueryState = "initial" | "loading" | "error" | "empty" | "success"

export function useCharactersClient() {
  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: ["characters"],
    queryFn: getCharactersClient,
    retry: 1,
    enabled: false,
  })

  const getQueryState = (): QueryState => {
    if (!data && !isLoading && !isError) return "initial"
    if (isLoading) return "loading"
    if (isError) return "error"
    if (!data || data.data.length === 0) return "empty"
    return "success"
  }

  const queryState = getQueryState()

  const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido"

  const handleRetry = () => refetch()

  const totalLabel = data ? `${data.total} ${data.total === 1 ? "personagem" : "personagens"}` : ""

  return {
    queryState,
    data,
    errorMessage,
    handleRetry,
    totalLabel,
  }
}
