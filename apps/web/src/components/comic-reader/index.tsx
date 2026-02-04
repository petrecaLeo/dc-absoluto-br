"use client"

import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Maximize2,
  Minimize2,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useComicReader } from "./comic-reader.hook"
import { ResumeReadingModal } from "./resume-reading-modal"

interface ComicReaderProps {
  downloadUrl: string
  comicTitle: string
  backUrl: string
  comicId: string
}

export function ComicReader({ downloadUrl, comicTitle, backUrl, comicId }: ComicReaderProps) {
  const {
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
    showControls,
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
    resumePage,
    isResumeModalOpen,
    handleResumeReading,
    handleStartOverReading,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    isDragging,
  } = useComicReader({ downloadUrl, comicTitle, comicId })

  const controlsHidden = isFullscreenActive && !showControls
  const fullscreenButtonTitle = isFullscreenActive ? "Sair da tela cheia (F)" : "Tela cheia (F)"
  const doublePageButtonTitle = isDoublePageMode ? "Página simples (D)" : "Página dupla (D)"

  if (loadingState === "idle" || loadingState === "loading" || loadingState === "extracting") {
    return (
      <div className="flex min-h-svh flex-col bg-dc-black">
        <div className="px-6 pt-6">
          <Link
            href={backUrl}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white uppercase">{comicTitle}</h1>
            <p className="mt-2 text-sm text-white/40">
              {loadingState === "loading"
                ? "Preparando HQ..."
                : loadingState === "extracting"
                  ? "Extraindo páginas..."
                  : "Finalizando..."}
            </p>
          </div>

          <div className="w-72">
            <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 bg-dc-blue transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Aguarde...</span>
          </div>
        </div>
      </div>
    )
  }

  if (loadingState === "error") {
    return (
      <div className="flex min-h-svh flex-col bg-dc-black">
        <div className="px-6 pt-6">
          <Link
            href={backUrl}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <h1 className="text-2xl font-bold text-white uppercase">{comicTitle}</h1>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4">
            <p className="text-red-400">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={retryExtract}
              className="rounded-full bg-dc-blue px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-dc-blue/80"
            >
              Tentar novamente
            </button>
            <Link
              href={backUrl}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Voltar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex min-h-svh flex-col bg-dc-black ${
        isFullscreenActive
          ? "fixed inset-0 z-[9999] h-[100dvh] w-[100vw] overscroll-none"
          : ""
      }`}
    >
      <ResumeReadingModal
        isOpen={isResumeModalOpen && resumePage !== null}
        comicTitle={comicTitle}
        page={resumePage ?? 0}
        totalPages={totalPages}
        onResume={handleResumeReading}
        onStartOver={handleStartOverReading}
        onClose={handleStartOverReading}
      />
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex flex-wrap items-center gap-2 border-b border-white/5 bg-dc-black/80 px-4 py-3 backdrop-blur-xl transition-all duration-300 md:flex-nowrap md:justify-between ${
          isFullscreenActive ? "pt-[calc(env(safe-area-inset-top)+0.75rem)]" : ""
        } ${controlsHidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <Link
          href={backUrl}
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-white uppercase md:flex-none md:max-w-md md:text-base">
          {comicTitle}
        </h1>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          <span
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="sr-only">Página </span>
            {isDoublePageMode && nextPageData
              ? `${currentPage + 1}-${currentPage + 2}`
              : currentPage + 1}{" "}
            / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-white/10 bg-white/5">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoomLevel <= 1}
                className="cursor-pointer rounded-l-full p-1.5 text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Diminuir zoom (-)"
                aria-label="Diminuir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-12 select-none px-1 text-center text-xs text-white/60">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoomLevel >= 4}
                className="cursor-pointer rounded-r-full p-1.5 text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Aumentar zoom (+)"
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={toggleDoublePageMode}
              className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
              title={doublePageButtonTitle}
              aria-label={doublePageButtonTitle}
              aria-pressed={isDoublePageMode}
            >
              {isDoublePageMode ? <BookOpen className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
              title={fullscreenButtonTitle}
              aria-label={fullscreenButtonTitle}
              aria-pressed={isFullscreenActive}
            >
              {isFullscreenActive ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className={`flex flex-1 items-center justify-center overflow-hidden ${isFullscreenActive ? "pt-0 pb-0" : "pt-24 pb-24 md:pt-14"}`}
      >
        {currentPageData && (
          <div
            ref={imageContainerRef}
            className={`relative flex h-full w-full items-center justify-center ${isZoomed ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            {!isZoomed && (
              <>
                <button
                  type="button"
                  onClick={goToPrevPage}
                  disabled={isFirstPage}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute left-0 top-0 z-10 h-full w-1/3 cursor-pointer opacity-0 disabled:cursor-default"
                  aria-label="Página anterior"
                />
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={isLastPage}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute right-0 top-0 z-10 h-full w-1/3 cursor-pointer opacity-0 disabled:cursor-default"
                  aria-label="Próxima página"
                />
              </>
            )}
            <div
              className={`flex items-center justify-center ${isDoublePageMode ? "gap-1" : ""}`}
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
              }}
            >
              <Image
                src={currentPageData.url}
                alt={`Página ${currentPage + 1}`}
                width={isDoublePageMode ? 600 : 800}
                height={isDoublePageMode ? 900 : 1200}
                className={`pointer-events-none w-auto select-none object-contain transition-transform duration-100 ${isFullscreenActive ? "max-h-[100svh]" : "max-h-[calc(100svh-152px)]"} ${isDoublePageMode ? "max-w-[50vw]" : ""}`}
                priority
                unoptimized
                draggable={false}
              />
              {isDoublePageMode && nextPageData && (
                <Image
                  src={nextPageData.url}
                  alt={`Página ${currentPage + 2}`}
                  width={600}
                  height={900}
                  className={`pointer-events-none max-w-[50vw] w-auto select-none object-contain transition-transform duration-100 ${isFullscreenActive ? "max-h-[100svh]" : "max-h-[calc(100svh-152px)]"}`}
                  priority
                  unoptimized
                  draggable={false}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-dc-black/80 px-4 py-4 backdrop-blur-xl transition-all duration-300 ${
          isFullscreenActive ? "pb-[calc(env(safe-area-inset-bottom)+1rem)]" : ""
        } ${controlsHidden ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={isFirstPage}
            className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
          >
            Anterior
          </button>

          <label className="sr-only" htmlFor="page-slider">
            Ir para página
          </label>
          <input
            id="page-slider"
            type="range"
            min={0}
            max={totalPages - 1}
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            aria-valuemin={1}
            aria-valuemax={totalPages}
            aria-valuenow={currentPage + 1}
            aria-valuetext={`Página ${currentPage + 1} de ${totalPages}`}
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/10 accent-dc-blue sm:w-48 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dc-blue [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
          />

          <button
            type="button"
            onClick={goToNextPage}
            disabled={isLastPage}
            className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
          >
            Próxima
          </button>
        </div>
        <p className="mt-2 hidden text-center text-xs text-white/30 lg:block">
          ← → navegar • F tela cheia • Z zoom • D página dupla
        </p>
      </footer>
    </div>
  )
}
