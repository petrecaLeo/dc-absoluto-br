"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { readingProgress, type ReadingProgress } from "@/services/reading-progress"
import { PUBLIC_API_URL } from "@/lib/env/public"
import { AUTH_COOKIE_KEY, decodeAuthCookie } from "@/components/header/auth.cookie"

interface ComicPage {
  name: string
  url: string
}

interface UseComicReaderProps {
  downloadUrl: string
  comicTitle: string
  comicId: string
}

type LoadingState = "idle" | "loading" | "extracting" | "ready" | "error"

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25
const PRELOAD_AHEAD = 3
const PRELOAD_BEHIND = 2
const SCROLL_THRESHOLD = 60
const SCROLL_COOLDOWN_MS = 250
const SCROLL_RESET_DELAY_MS = 140
const READING_COMPLETION_BUFFER = 5

function getAuthUserFromCookie() {
  if (typeof document === "undefined") return null

  const rawCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_KEY}=`))

  if (!rawCookie) return null

  const value = rawCookie.substring(`${AUTH_COOKIE_KEY}=`.length)
  return decodeAuthCookie(value)
}

export function useComicReader({ downloadUrl, comicTitle, comicId }: UseComicReaderProps) {
  const [pages, setPages] = useState<ComicPage[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDoublePageMode, setIsDoublePageMode] = useState(false)
  const isExtractingRef = useRef(false)
  const hasExtractedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTouchDistanceRef = useRef<number | null>(null)
  const lastPanPositionRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const scrollLockRef = useRef<{
    bodyOverflow: string
    htmlOverflow: string
    bodyPosition: string
    bodyTop: string
    bodyLeft: string
    bodyRight: string
    bodyWidth: string
    scrollY: number
  } | null>(null)
  const wheelAccumulatorRef = useRef(0)
  const wheelResetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastWheelTriggerRef = useRef(0)
  const CONTROLS_HIDE_DELAY = 2000
  const [resumePage, setResumePage] = useState<number | null>(null)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const resumeHandledRef = useRef(false)
  const hasMarkedReadRef = useRef(false)

  const totalPages = pages.length
  const isFirstPage = currentPage === 0
  const isLastPage = isDoublePageMode
    ? currentPage >= totalPages - 2
    : currentPage === totalPages - 1
  const isZoomed = zoomLevel > 1
  const isFullscreenActive = isFullscreen || isPseudoFullscreen
  const nextPageData =
    isDoublePageMode && currentPage + 1 < totalPages ? pages[currentPage + 1] : null

  const authUserId = getAuthUserFromCookie()?.id ?? null

  const isProgressForUser = useCallback(
    (progress: ReadingProgress | null) => {
      if (!progress) return false
      if (!authUserId) return !progress.userId
      return progress.userId === authUserId
    },
    [authUserId],
  )

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
    lastPanPositionRef.current = { x: 0, y: 0 }
  }, [])

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM)
      if (newZoom === MIN_ZOOM) {
        setPanPosition({ x: 0, y: 0 })
        lastPanPositionRef.current = { x: 0, y: 0 }
      }
      return newZoom
    })
  }, [])

  const toggleZoom = useCallback(() => {
    if (zoomLevel > 1) {
      resetZoom()
    } else {
      setZoomLevel(2)
    }
  }, [zoomLevel, resetZoom])

  const goToNextPage = useCallback(() => {
    if (!isLastPage) {
      const step = isDoublePageMode ? 2 : 1
      setCurrentPage((prev) => Math.min(prev + step, totalPages - 1))
    }
  }, [isLastPage, isDoublePageMode, totalPages])

  const goToPrevPage = useCallback(() => {
    if (!isFirstPage) {
      const step = isDoublePageMode ? 2 : 1
      setCurrentPage((prev) => Math.max(prev - step, 0))
    }
  }, [isFirstPage, isDoublePageMode])

  const toggleDoublePageMode = useCallback(() => {
    setIsDoublePageMode((prev) => !prev)
    setCurrentPage((prev) => (prev % 2 === 1 ? prev - 1 : prev))
  }, [])

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page)
      }
    },
    [totalPages],
  )

  const handleResumeReading = useCallback(() => {
    setIsResumeModalOpen(false)

    if (resumePage === null) {
      return
    }

    goToPage(resumePage)
  }, [goToPage, resumePage])

  const handleStartOverReading = useCallback(() => {
    setIsResumeModalOpen(false)
    setResumePage(null)
    goToPage(0)

    if (comicId) {
      readingProgress.clearProgress(comicId)
    }
  }, [comicId, goToPage])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    const fullscreenElement =
      document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element })
        .webkitFullscreenElement

    const exitFullscreen =
      document.exitFullscreen ||
      (document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen

    if (fullscreenElement) {
      if (exitFullscreen) {
        await exitFullscreen.call(document)
      }
      return
    }

    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false)
      return
    }

    const requestFullscreen =
      container.requestFullscreen ||
      (container as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
        .webkitRequestFullscreen ||
      (container as HTMLElement & { webkitRequestFullScreen?: () => Promise<void> })
        .webkitRequestFullScreen

    if (requestFullscreen) {
      try {
        await requestFullscreen.call(container)
        return
      } catch (error) {
        console.warn("Fullscreen API falhou, usando fallback:", error)
      }
    }

    setIsPseudoFullscreen(true)
  }, [isPseudoFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
      const isNowFullscreen = !!fullscreenElement
      setIsFullscreen(isNowFullscreen)
      if (isNowFullscreen) {
        setIsPseudoFullscreen(false)
        setShowControls(false)
      } else {
        setShowControls(true)
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current)
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (!isPseudoFullscreen) return

    setShowControls(true)

    const html = document.documentElement
    const body = document.body

    scrollLockRef.current = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      scrollY: window.scrollY,
    }

    body.style.overflow = "hidden"
    html.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollLockRef.current.scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"

    return () => {
      const lockState = scrollLockRef.current
      if (!lockState) return

      body.style.overflow = lockState.bodyOverflow
      html.style.overflow = lockState.htmlOverflow
      body.style.position = lockState.bodyPosition
      body.style.top = lockState.bodyTop
      body.style.left = lockState.bodyLeft
      body.style.right = lockState.bodyRight
      body.style.width = lockState.bodyWidth
      window.scrollTo(0, lockState.scrollY)
      scrollLockRef.current = null
    }
  }, [isPseudoFullscreen])

  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
    setShowControls(true)
    if (isFullscreen) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, CONTROLS_HIDE_DELAY)
    }
  }, [isFullscreen])

  useEffect(() => {
    if (!isFullscreen) return

    const handleMouseMove = () => {
      resetHideControlsTimer()
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [isFullscreen, resetHideControlsTimer])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isResumeModalOpen) {
        if (event.key === "Escape") {
          event.preventDefault()
          handleStartOverReading()
        }
        return
      }

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault()
        goToNextPage()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        goToPrevPage()
      } else if (event.key === "Home") {
        event.preventDefault()
        goToPage(0)
      } else if (event.key === "End") {
        event.preventDefault()
        goToPage(totalPages - 1)
      } else if (event.key === "f" || event.key === "F") {
        event.preventDefault()
        toggleFullscreen()
      } else if (event.key === "z" || event.key === "Z") {
        event.preventDefault()
        toggleZoom()
      } else if (event.key === "Escape") {
        if (isFullscreenActive) {
          event.preventDefault()
          toggleFullscreen()
          return
        }
        if (isZoomed) {
          event.preventDefault()
          resetZoom()
        }
      } else if (event.key === "d" || event.key === "D") {
        event.preventDefault()
        toggleDoublePageMode()
      }
    },
    [
      goToNextPage,
      goToPrevPage,
      goToPage,
      totalPages,
      toggleFullscreen,
      toggleZoom,
      isFullscreenActive,
      isZoomed,
      resetZoom,
      toggleDoublePageMode,
      isResumeModalOpen,
      handleStartOverReading,
    ],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (event.deltaY === 0) return

      const now = Date.now()
      if (now - lastWheelTriggerRef.current < SCROLL_COOLDOWN_MS) {
        return
      }

      wheelAccumulatorRef.current += event.deltaY

      if (wheelResetTimeoutRef.current) {
        clearTimeout(wheelResetTimeoutRef.current)
      }
      wheelResetTimeoutRef.current = setTimeout(() => {
        wheelAccumulatorRef.current = 0
      }, SCROLL_RESET_DELAY_MS)

      if (Math.abs(wheelAccumulatorRef.current) < SCROLL_THRESHOLD) {
        return
      }

      let didNavigate = false

      if (wheelAccumulatorRef.current > 0) {
        if (!isLastPage) {
          event.preventDefault()
          goToNextPage()
          didNavigate = true
        }
      } else if (!isFirstPage) {
        event.preventDefault()
        goToPrevPage()
        didNavigate = true
      }

      wheelAccumulatorRef.current = 0
      if (didNavigate) {
        lastWheelTriggerRef.current = now
      }
    },
    [goToNextPage, goToPrevPage, isFirstPage, isLastPage],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelEvent = (event: WheelEvent) => {
      handleWheel(event)
    }

    container.addEventListener("wheel", handleWheelEvent, { passive: false })
    return () => container.removeEventListener("wheel", handleWheelEvent)
  }, [handleWheel])

  useEffect(() => {
    return () => {
      if (wheelResetTimeoutRef.current) {
        clearTimeout(wheelResetTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    resumeHandledRef.current = false
    hasMarkedReadRef.current = false
  }, [comicId])

  useEffect(() => {
    if (!comicId || loadingState !== "ready" || totalPages === 0 || resumeHandledRef.current) {
      return
    }

    const savedProgress = readingProgress.getProgress(comicId)
    if (!savedProgress) {
      resumeHandledRef.current = true
      return
    }

    if (!isProgressForUser(savedProgress)) {
      resumeHandledRef.current = true
      return
    }

    if (savedProgress.page > 0 && savedProgress.page < totalPages) {
      setResumePage(savedProgress.page)
      setIsResumeModalOpen(true)
    } else if (savedProgress.page >= totalPages) {
      readingProgress.clearProgress(comicId)
    }

    resumeHandledRef.current = true
  }, [comicId, isProgressForUser, loadingState, totalPages])

  const prevPageRef = useRef(currentPage)
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      setZoomLevel(1)
      setPanPosition({ x: 0, y: 0 })
      lastPanPositionRef.current = { x: 0, y: 0 }
      prevPageRef.current = currentPage
    }
  }, [currentPage])

  useEffect(() => {
    if (!comicId || loadingState !== "ready" || totalPages === 0 || isResumeModalOpen) {
      return
    }

    if (currentPage === 0) {
      const existingProgress = readingProgress.getProgress(comicId)
      if (!existingProgress || isProgressForUser(existingProgress)) {
        readingProgress.clearProgress(comicId)
      }
      return
    }

    readingProgress.setProgress(comicId, currentPage, totalPages, authUserId)
  }, [authUserId, comicId, currentPage, isResumeModalOpen, isProgressForUser, loadingState, totalPages])

  useEffect(() => {
    if (!authUserId || !comicId || loadingState !== "ready" || totalPages === 0) {
      return
    }

    if (hasMarkedReadRef.current) return

    const completionThreshold =
      totalPages <= READING_COMPLETION_BUFFER
        ? totalPages
        : totalPages - READING_COMPLETION_BUFFER

    if (currentPage + 1 < completionThreshold) return

    hasMarkedReadRef.current = true

    void fetch(`/api/comics/${comicId}/read`, {
      method: "POST",
    }).catch(() => {
      // silencioso para o usuário
    })
  }, [authUserId, comicId, currentPage, loadingState, totalPages])

  const getTouchDistance = useCallback((touches: React.TouchList) => {
    const firstTouch = touches.item(0)
    const secondTouch = touches.item(1)
    if (!firstTouch || !secondTouch) return 0
    const dx = firstTouch.clientX - secondTouch.clientX
    const dy = firstTouch.clientY - secondTouch.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2) {
        lastTouchDistanceRef.current = getTouchDistance(event.touches)
      } else if (event.touches.length === 1 && isZoomed) {
        const touch = event.touches.item(0)
        if (!touch) return
        isDraggingRef.current = true
        dragStartRef.current = {
          x: touch.clientX - panPosition.x,
          y: touch.clientY - panPosition.y,
        }
      }
    },
    [isZoomed, panPosition, getTouchDistance],
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault()
        const currentDistance = getTouchDistance(event.touches)
        if (lastTouchDistanceRef.current !== null) {
          const delta = currentDistance - lastTouchDistanceRef.current
          const zoomDelta = delta * 0.01
          setZoomLevel((prev) => {
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + zoomDelta))
            if (newZoom === MIN_ZOOM) {
              setPanPosition({ x: 0, y: 0 })
              lastPanPositionRef.current = { x: 0, y: 0 }
            }
            return newZoom
          })
        }
        lastTouchDistanceRef.current = currentDistance
      } else if (event.touches.length === 1 && isDraggingRef.current && isZoomed) {
        const touch = event.touches.item(0)
        if (!touch) return
        const newX = touch.clientX - dragStartRef.current.x
        const newY = touch.clientY - dragStartRef.current.y
        setPanPosition({ x: newX, y: newY })
      }
    },
    [isZoomed, getTouchDistance],
  )

  const handleTouchEnd = useCallback(() => {
    lastTouchDistanceRef.current = null
    isDraggingRef.current = false
    lastPanPositionRef.current = panPosition
  }, [panPosition])

  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isZoomed) return
      event.preventDefault()
      setIsDragging(true)
      dragStartRef.current = {
        x: event.clientX - panPosition.x,
        y: event.clientY - panPosition.y,
      }
    },
    [isZoomed, panPosition],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (event: MouseEvent) => {
      const newX = event.clientX - dragStartRef.current.x
      const newY = event.clientY - dragStartRef.current.y
      setPanPosition({ x: newX, y: newY })
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleGlobalMouseMove)
    window.addEventListener("mouseup", handleGlobalMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging])

  const extractComic = useCallback(
    async (forceRetry = false) => {
      if (!downloadUrl) {
        setError("URL de download não disponível")
        setLoadingState("error")
        return
      }

      if (!forceRetry && (isExtractingRef.current || hasExtractedRef.current)) {
        return
      }

      isExtractingRef.current = true

      try {
        setLoadingState("loading")
        setProgress(0)
        setError(null)

        const proxyUrl = `${PUBLIC_API_URL}/api/proxy/download?url=${encodeURIComponent(downloadUrl)}`
        const response = await fetch(proxyUrl)

        if (!response.ok) {
          throw new Error(`Erro ao baixar arquivo: ${response.status}`)
        }

        const contentLength = response.headers.get("content-length")
        const total = contentLength ? Number.parseInt(contentLength, 10) : 0
        const reader = response.body?.getReader()

        if (!reader) {
          throw new Error("Não foi possível ler o arquivo")
        }

        const chunks: ArrayBuffer[] = []
        let received = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          chunks.push(value.buffer as ArrayBuffer)
          received += value.length

          if (total > 0) {
            setProgress(Math.round((received / total) * 50))
          }
        }

        const blob = new Blob(chunks)
        const arrayBuffer = await blob.arrayBuffer()

        setLoadingState("extracting")
        setProgress(50)

        const { Archive } = await import("libarchive.js")

        Archive.init({
          workerUrl: "/libarchive/worker-bundle.js",
        })

        const archive = await Archive.open(new File([arrayBuffer], "comic.cbr"))
        const filesArray = await archive.getFilesArray()

        const imageFiles = filesArray
          .filter((file) => {
            const name = file.file.name.toLowerCase()
            return (
              name.endsWith(".jpg") ||
              name.endsWith(".jpeg") ||
              name.endsWith(".png") ||
              name.endsWith(".webp") ||
              name.endsWith(".gif")
            )
          })
          .sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true }))

        const extractedPages: ComicPage[] = []

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i]
          const extractedFile = await file.file.extract()
          const url = URL.createObjectURL(extractedFile)
          extractedPages.push({ name: file.file.name, url })
          setProgress(50 + Math.round(((i + 1) / imageFiles.length) * 50))
        }

        setPages(extractedPages)
        setLoadingState("ready")
        setProgress(100)
        hasExtractedRef.current = true
      } catch (err) {
        console.error("Erro ao extrair HQ:", err)
        setError(err instanceof Error ? err.message : "Erro desconhecido ao extrair HQ")
        setLoadingState("error")
      } finally {
        isExtractingRef.current = false
      }
    },
    [downloadUrl],
  )

  useEffect(() => {
    extractComic()
  }, [extractComic])

  useEffect(() => {
    return () => {
      for (const page of pages) {
        URL.revokeObjectURL(page.url)
      }
    }
  }, [pages])

  useEffect(() => {
    if (pages.length === 0) return

    const pagesToPreload: number[] = []

    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const nextPage = currentPage + i
      if (nextPage < pages.length) {
        pagesToPreload.push(nextPage)
      }
    }

    for (let i = 1; i <= PRELOAD_BEHIND; i++) {
      const prevPage = currentPage - i
      if (prevPage >= 0) {
        pagesToPreload.push(prevPage)
      }
    }

    for (const pageIndex of pagesToPreload) {
      const page = pages[pageIndex]
      if (!page) continue
      const img = new window.Image()
      img.src = page.url
    }
  }, [currentPage, pages])

  const currentPageData = pages[currentPage]

  const retryExtract = useCallback(() => {
    hasExtractedRef.current = false
    extractComic(true)
  }, [extractComic])

  return {
    pages,
    currentPage,
    currentPageData,
    nextPageData,
    totalPages,
    loadingState,
    error,
    progress,
    isFirstPage,
    isLastPage,
    isFullscreenActive,
    isPseudoFullscreen,
    showControls,
    comicTitle,
    containerRef,
    imageContainerRef,
    zoomLevel,
    panPosition,
    isZoomed,
    isDoublePageMode,
    goToNextPage,
    goToPrevPage,
    goToPage,
    toggleFullscreen,
    toggleDoublePageMode,
    retryExtract,
    zoomIn,
    zoomOut,
    toggleZoom,
    resetZoom,
    resumePage,
    isResumeModalOpen,
    handleResumeReading,
    handleStartOverReading,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    isDragging,
  }
}
