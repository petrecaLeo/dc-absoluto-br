"use client"

import { getStoredUser } from "@/components/header/auth.storage"
import { PUBLIC_API_URL } from "@/lib/env/public"
import { getCachedComic, setCachedComic } from "@/services/comic-cache"
import { type ReadingProgress, readingProgress } from "@/services/reading-progress"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface ComicPage {
  name: string
  url: string
  width: number
  height: number
  isLandscape: boolean
}

interface UseComicReaderProps {
  downloadUrl: string
  comicTitle: string
  comicId: string
  disableReadTracking?: boolean
}

type LoadingState = "idle" | "loading" | "extracting" | "ready" | "error"

const MIN_ZOOM = 1
const ZOOM_STEP = 0.25
const PDF_RENDER_SCALE = 2
const PRELOAD_AHEAD = 3
const PRELOAD_BEHIND = 2
const SCROLL_THRESHOLD = 60
const SCROLL_COOLDOWN_MS = 250
const SCROLL_RESET_DELAY_MS = 140
const READING_COMPLETION_BUFFER = 5

interface ExtractedPageForCache {
  name: string
  blob: Blob
  width: number
  height: number
  isLandscape: boolean
}

interface ExtractedComicPages {
  pages: ComicPage[]
  blobsForCache: ExtractedPageForCache[]
}

function getUrlPathname(value: string) {
  try {
    return new URL(value).pathname.toLowerCase()
  } catch {
    return value.toLowerCase()
  }
}

function hasPdfSignature(arrayBuffer: ArrayBuffer) {
  if (arrayBuffer.byteLength < 5) return false

  const header = new Uint8Array(arrayBuffer.slice(0, 5))
  return (
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d
  )
}

function isPdfFile(response: Response, downloadUrl: string, arrayBuffer: ArrayBuffer) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
  const contentDisposition = response.headers.get("content-disposition")?.toLowerCase() ?? ""
  const pathname = getUrlPathname(downloadUrl)

  return (
    contentType.includes("pdf") ||
    contentDisposition.includes(".pdf") ||
    pathname.endsWith(".pdf") ||
    hasPdfSignature(arrayBuffer)
  )
}

function getImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error("Não foi possível renderizar a página do PDF"))
    }, "image/png")
  })
}

async function extractArchivePages(
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void,
): Promise<ExtractedComicPages> {
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

  if (imageFiles.length === 0) {
    throw new Error("Nenhuma imagem encontrada no arquivo da HQ")
  }

  const extractedPages: ComicPage[] = []
  const blobsForCache: ExtractedPageForCache[] = []

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const extractedFile = await file.file.extract()
    const url = URL.createObjectURL(extractedFile)
    const dimensions = await getImageDimensions(url)

    const page = {
      name: file.file.name,
      url,
      width: dimensions.width,
      height: dimensions.height,
      isLandscape: dimensions.width > dimensions.height,
    }

    extractedPages.push(page)
    blobsForCache.push({
      name: page.name,
      blob: extractedFile,
      width: page.width,
      height: page.height,
      isLandscape: page.isLandscape,
    })
    onProgress(50 + Math.round(((i + 1) / imageFiles.length) * 50))
  }

  return { pages: extractedPages, blobsForCache }
}

async function extractPdfPages(
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void,
): Promise<ExtractedComicPages> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString()

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdf = await loadingTask.promise

  if (pdf.numPages === 0) {
    await pdf.destroy()
    throw new Error("PDF sem páginas para leitura")
  }

  const extractedPages: ComicPage[] = []
  const blobsForCache: ExtractedPageForCache[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const pdfPage = await pdf.getPage(pageNumber)
      const viewport = pdfPage.getViewport({ scale: PDF_RENDER_SCALE })
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")

      if (!context) {
        throw new Error("Canvas indisponível para renderizar PDF")
      }

      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)

      await pdfPage.render({
        canvasContext: context,
        viewport,
      }).promise

      const blob = await canvasToBlob(canvas)
      const url = URL.createObjectURL(blob)
      const page = {
        name: `page-${String(pageNumber).padStart(3, "0")}.png`,
        url,
        width: canvas.width,
        height: canvas.height,
        isLandscape: canvas.width > canvas.height,
      }

      extractedPages.push(page)
      blobsForCache.push({
        name: page.name,
        blob,
        width: page.width,
        height: page.height,
        isLandscape: page.isLandscape,
      })

      pdfPage.cleanup()
      onProgress(50 + Math.round((pageNumber / pdf.numPages) * 50))
    }
  } finally {
    await pdf.destroy()
  }

  return { pages: extractedPages, blobsForCache }
}

export function useComicReader({
  downloadUrl,
  comicTitle,
  comicId,
  disableReadTracking,
}: UseComicReaderProps) {
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
  const CONTROLS_HIDE_DELAY = 1000
  const [resumePage, setResumePage] = useState<number | null>(null)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const resumeHandledRef = useRef(false)
  const hasMarkedReadRef = useRef(false)

  const [maxZoomLevel, setMaxZoomLevel] = useState(4)

  const totalPages = pages.length
  const isFirstPage = currentPage === 0

  const doublePageGroups = useMemo(() => {
    const groups: { startIndex: number; pages: ComicPage[] }[] = []
    let i = 0
    while (i < pages.length) {
      const current = pages[i]
      const next = pages[i + 1]
      if (!current) break
      if (current.isLandscape) {
        groups.push({ startIndex: i, pages: [current] })
        i++
      } else if (next && !next.isLandscape) {
        groups.push({ startIndex: i, pages: [current, next] })
        i += 2
      } else {
        groups.push({ startIndex: i, pages: [current] })
        i++
      }
    }
    return groups
  }, [pages])

  const currentPageIsLandscape = pages[currentPage]?.isLandscape ?? false
  const showSingleInDoubleMode = isDoublePageMode && currentPageIsLandscape
  const isLastPage = isDoublePageMode
    ? doublePageGroups.length > 0 && currentPage === doublePageGroups.at(-1)?.startIndex
    : currentPage === totalPages - 1
  const isZoomed = zoomLevel > 1
  const isFullscreenActive = isFullscreen || isPseudoFullscreen
  const nextPageData =
    isDoublePageMode && !currentPageIsLandscape && currentPage + 1 < totalPages
      ? pages[currentPage + 1]
      : null

  const authUserId = getStoredUser()?.id ?? null

  const isProgressForUser = useCallback(
    (progress: ReadingProgress | null) => {
      if (!progress) return false
      if (!authUserId) return !progress.userId
      return progress.userId === authUserId
    },
    [authUserId],
  )

  const computeMaxZoom = useCallback(() => {
    const page = pages[currentPage]
    if (!page || page.width <= 0 || page.height <= 0) return

    const svh = window.innerHeight
    const maxImageHeight = isFullscreenActive ? svh : svh - 152
    const screenWidth = window.innerWidth

    if (screenWidth <= 0 || maxImageHeight <= 0) return

    const getBaseWidth = (p: ComicPage) => {
      const imageHeight = Math.min(p.height, maxImageHeight)
      return imageHeight * (p.width / p.height)
    }

    let contentWidth: number
    if (isDoublePageMode && !currentPageIsLandscape) {
      const nextPage = pages[currentPage + 1]
      if (nextPage && !nextPage.isLandscape) {
        contentWidth = getBaseWidth(page) + getBaseWidth(nextPage) + 8 // gap-2
      } else {
        contentWidth = getBaseWidth(page)
      }
    } else {
      contentWidth = getBaseWidth(page)
    }

    const computed = Math.floor((screenWidth / contentWidth) * 100) / 100
    const clamped = Math.max(MIN_ZOOM, computed)
    setMaxZoomLevel(clamped)
    setZoomLevel((prev) => {
      if (prev > clamped) {
        setPanPosition({ x: 0, y: 0 })
        lastPanPositionRef.current = { x: 0, y: 0 }
        return clamped
      }
      return prev
    })
  }, [pages, currentPage, isDoublePageMode, currentPageIsLandscape, isFullscreenActive])

  useEffect(() => {
    if (pages.length === 0) return
    const timer = setTimeout(computeMaxZoom, 100)
    return () => clearTimeout(timer)
  }, [pages.length, currentPage, isDoublePageMode, isFullscreenActive, computeMaxZoom])

  useEffect(() => {
    window.addEventListener("resize", computeMaxZoom)
    return () => window.removeEventListener("resize", computeMaxZoom)
  }, [computeMaxZoom])

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
    lastPanPositionRef.current = { x: 0, y: 0 }
  }, [])

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, maxZoomLevel))
  }, [maxZoomLevel])

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
      setZoomLevel(Math.min(2, maxZoomLevel))
    }
  }, [zoomLevel, resetZoom, maxZoomLevel])

  const goToNextPage = useCallback(() => {
    if (isLastPage) return
    if (!isDoublePageMode) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
      return
    }
    const groupIndex = doublePageGroups.findIndex((g) => g.startIndex === currentPage)
    const nextGroup = doublePageGroups[groupIndex + 1]
    if (groupIndex !== -1 && nextGroup) {
      setCurrentPage(nextGroup.startIndex)
    }
  }, [isLastPage, isDoublePageMode, totalPages, doublePageGroups, currentPage])

  const goToPrevPage = useCallback(() => {
    if (isFirstPage) return
    if (!isDoublePageMode) {
      setCurrentPage((prev) => Math.max(prev - 1, 0))
      return
    }
    const groupIndex = doublePageGroups.findIndex((g) => g.startIndex === currentPage)
    const prevGroup = doublePageGroups[groupIndex - 1]
    if (prevGroup) {
      setCurrentPage(prevGroup.startIndex)
    }
  }, [isFirstPage, isDoublePageMode, doublePageGroups, currentPage])

  const toggleDoublePageMode = useCallback(() => {
    setIsDoublePageMode((prev) => {
      const newMode = !prev
      if (newMode && doublePageGroups.length > 0) {
        const group = doublePageGroups.find(
          (g) => currentPage >= g.startIndex && currentPage < g.startIndex + g.pages.length,
        )
        if (group && currentPage !== group.startIndex) {
          setCurrentPage(group.startIndex)
        }
      }
      return newMode
    })
  }, [doublePageGroups, currentPage])

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
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement

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
  }, [
    authUserId,
    comicId,
    currentPage,
    isResumeModalOpen,
    isProgressForUser,
    loadingState,
    totalPages,
  ])

  useEffect(() => {
    if (
      disableReadTracking ||
      !authUserId ||
      !comicId ||
      loadingState !== "ready" ||
      totalPages === 0
    ) {
      return
    }

    if (hasMarkedReadRef.current) return

    const completionThreshold =
      totalPages <= READING_COMPLETION_BUFFER ? totalPages : totalPages - READING_COMPLETION_BUFFER

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
            const newZoom = Math.max(MIN_ZOOM, Math.min(maxZoomLevel, prev + zoomDelta))
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
    [isZoomed, getTouchDistance, maxZoomLevel],
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

        if (!forceRetry && comicId) {
          const cached = await getCachedComic(comicId)
          if (cached && cached.pages.length > 0) {
            setProgress(50)
            setLoadingState("extracting")

            const restoredPages: ComicPage[] = cached.pages.map((p) => ({
              name: p.name,
              url: URL.createObjectURL(p.blob),
              width: p.width,
              height: p.height,
              isLandscape: p.isLandscape,
            }))

            setPages(restoredPages)
            setLoadingState("ready")
            setProgress(100)
            hasExtractedRef.current = true
            isExtractingRef.current = false
            return
          }
        }

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

          chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
          received += value.length

          if (total > 0) {
            setProgress(Math.round((received / total) * 50))
          }
        }

        const blob = new Blob(chunks)
        const arrayBuffer = await blob.arrayBuffer()

        setLoadingState("extracting")
        setProgress(50)

        const extracted = isPdfFile(response, downloadUrl, arrayBuffer)
          ? await extractPdfPages(arrayBuffer, setProgress)
          : await extractArchivePages(arrayBuffer, setProgress)

        setPages(extracted.pages)
        setLoadingState("ready")
        setProgress(100)
        hasExtractedRef.current = true

        if (comicId) {
          setCachedComic(comicId, extracted.blobsForCache).catch(() => {})
        }
      } catch (err) {
        console.error("Erro ao extrair HQ:", err)
        setError(err instanceof Error ? err.message : "Erro desconhecido ao extrair HQ")
        setLoadingState("error")
      } finally {
        isExtractingRef.current = false
      }
    },
    [comicId, downloadUrl],
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
    showSingleInDoubleMode,
    doublePageGroups,
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
    maxZoomLevel,
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
