"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PROFILE_IMAGE_OPTIONS } from "@dc-absoluto/shared-types"

import type { AuthUser } from "@/components/header/auth.types"
import { storeUser, subscribeAuthChanges } from "@/components/header/auth.storage"
import { parseAuthUser } from "@/components/header/auth.validation"

export type ProfileImageStatus = "idle" | "saving" | "success" | "error"

const ACCENT_COLOR = "var(--color-dc-blue)"

interface PerfilIdentidadeState {
  authUser: AuthUser
  isModalOpen: boolean
  options: Array<{
    id: string
    label: string
    src: string
    isSelected: boolean
  }>
  selectedImage: string | null
  status: ProfileImageStatus
  message: string
  isSaving: boolean
  canSave: boolean
  hasChanges: boolean
  accentColor: string
  openModal: () => void
  closeModal: () => void
  selectImage: (id: string) => void
  saveImage: () => Promise<void>
}

export function usePerfilIdentidade(initialAuthUser: AuthUser): PerfilIdentidadeState {
  const [authUser, setAuthUser] = useState<AuthUser>(initialAuthUser)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(
    initialAuthUser.profileImage ?? null,
  )
  const [status, setStatus] = useState<ProfileImageStatus>("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    setAuthUser(initialAuthUser)
    setSelectedImage(initialAuthUser.profileImage ?? null)
  }, [initialAuthUser])

  useEffect(() => {
    if (!isModalOpen || typeof document === "undefined") return
    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior
    const previousHtmlScrollSnapType = document.documentElement.style.scrollSnapType
    const previousBodyScrollBehavior = document.body.style.scrollBehavior
    const previousBodyScrollSnapType = document.body.style.scrollSnapType

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    document.documentElement.style.overflow = "hidden"
    document.documentElement.style.scrollBehavior = "auto"
    document.documentElement.style.scrollSnapType = "none"
    document.body.style.scrollBehavior = "auto"
    document.body.style.scrollSnapType = "none"

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.scrollBehavior = "auto"
      document.documentElement.style.scrollSnapType = previousHtmlScrollSnapType
      document.body.style.scrollBehavior = previousBodyScrollBehavior
      document.body.style.scrollSnapType = previousBodyScrollSnapType
      window.scrollTo(0, scrollY)
      document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior
    }
  }, [isModalOpen])

  useEffect(() => {
    const unsubscribe = subscribeAuthChanges((user) => {
      if (!user) return
      setAuthUser(user)
      setSelectedImage(user.profileImage ?? null)
    })

    return () => unsubscribe()
  }, [])

  const options = useMemo(
    () =>
      PROFILE_IMAGE_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        src: `/images/profile/${option.file}`,
        isSelected: option.id === selectedImage,
      })),
    [selectedImage],
  )

  const resetFeedback = useCallback(() => {
    setStatus("idle")
    setMessage("")
  }, [])

  const openModal = useCallback(() => {
    resetFeedback()
    setSelectedImage(authUser.profileImage ?? null)
    setIsModalOpen(true)
  }, [authUser.profileImage, resetFeedback])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const selectImage = useCallback(
    (id: string) => {
      setSelectedImage(id)
      resetFeedback()
    },
    [resetFeedback],
  )

  const hasChanges = (authUser.profileImage ?? null) !== (selectedImage ?? null)
  const isSaving = status === "saving"
  const canSave = Boolean(selectedImage) && hasChanges && !isSaving

  const saveImage = useCallback(async () => {
    if (!selectedImage || isSaving) return

    setStatus("saving")
    setMessage("")

    try {
      const response = await fetch("/api/auth/profile-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage: selectedImage }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        const parsedUser = parseAuthUser(data.user)
        const updatedUser = parsedUser ?? {
          ...authUser,
          profileImage: selectedImage,
        }

        storeUser(updatedUser)
        setAuthUser(updatedUser)
        setStatus("success")
        setMessage(data.message ?? "Foto atualizada com sucesso.")
        setIsModalOpen(false)
        return
      }

      setStatus("error")
      setMessage(data.message ?? "Nao foi possivel atualizar a foto.")
    } catch {
      setStatus("error")
      setMessage("Erro de conexao. Tente novamente.")
    }
  }, [authUser, isSaving, selectedImage])

  return {
    authUser,
    isModalOpen,
    options,
    selectedImage,
    status,
    message,
    isSaving,
    canSave,
    hasChanges,
    accentColor: ACCENT_COLOR,
    openModal,
    closeModal,
    selectImage,
    saveImage,
  }
}
