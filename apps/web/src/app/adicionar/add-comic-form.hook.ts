"use client"

import { type Character, DEFAULT_COMIC_UNIVERSE } from "@dc-absoluto/shared-types"
import { useRouter } from "next/navigation"
import { type FormEvent, useCallback, useMemo, useState } from "react"

export interface AddComicFormValues {
  characterId: string
  title: string
  issueNumber: string
  releaseDate: string
  downloadUrl: string
  universe: string
  coverUrl: string
  writer: string
  artists: string
  publisher: string
}

export type AddComicField = keyof AddComicFormValues

const INITIAL_VALUES: AddComicFormValues = {
  characterId: "",
  title: "",
  issueNumber: "",
  releaseDate: "",
  downloadUrl: "",
  universe: DEFAULT_COMIC_UNIVERSE,
  coverUrl: "",
  writer: "",
  artists: "",
  publisher: "",
}

const optional = (value: string) => value.trim() || undefined

export function buildComicPayload(values: AddComicFormValues) {
  return {
    characterId: values.characterId,
    title: values.title.trim(),
    issueNumber: Number(values.issueNumber),
    releaseDate: values.releaseDate,
    downloadUrl: values.downloadUrl.trim(),
    universe: values.universe.trim() || DEFAULT_COMIC_UNIVERSE,
    coverUrl: optional(values.coverUrl),
    writer: optional(values.writer),
    artists: optional(values.artists),
    publisher: optional(values.publisher),
  }
}

interface CreatedComic {
  title: string
  href: string | null
}

export function useAddComicForm(characters: Character[]) {
  const router = useRouter()
  const [values, setValues] = useState<AddComicFormValues>(INITIAL_VALUES)
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [createdComic, setCreatedComic] = useState<CreatedComic | null>(null)

  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [characters],
  )

  const setField = useCallback((field: AddComicField, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (status === "saving") return

      const payload = buildComicPayload(values)
      if (!Number.isFinite(payload.issueNumber)) {
        setStatus("error")
        setMessage("Número da HQ inválido.")
        return
      }

      setStatus("saving")
      setMessage("")
      setCreatedComic(null)

      try {
        const response = await fetch("/api/admin/comics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await response.json().catch(() => ({}))

        if (response.status === 401) {
          setStatus("error")
          setMessage("Sua sessão de administrador expirou. Entre de novo para continuar.")
          router.refresh()
          return
        }

        if (!response.ok) {
          setStatus("error")
          setMessage(
            typeof data.message === "string" ? data.message : "Não foi possível cadastrar a HQ.",
          )
          return
        }

        const character = characters.find((item) => item.id === payload.characterId)
        const universe = data.data?.universe ?? payload.universe

        setCreatedComic({
          title: payload.title,
          href: character ? `/${character.slug}/${universe}` : null,
        })
        // O formulário não é limpo: a próxima edição costuma mudar só nome, número, data e link.
        setStatus("success")
        setMessage("HQ cadastrada com sucesso.")
      } catch {
        setStatus("error")
        setMessage("Erro de conexão. Tente novamente.")
      }
    },
    [characters, router, status, values],
  )

  return {
    values,
    setField,
    sortedCharacters,
    status,
    message,
    createdComic,
    handleSubmit,
    isSaving: status === "saving",
  }
}
