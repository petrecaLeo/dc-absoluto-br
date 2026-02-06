"use client"

import { useEffect, useRef } from "react"

const WHEEL_LOCK_MS = 900
const MIN_WHEEL_DELTA = 8

function isInteractiveElement(target: Element | null) {
  if (!target) return false
  return Boolean(
    target.closest(
      "input, textarea, select, option, [contenteditable='true'], [data-fullpage-ignore]"
    )
  )
}

function hasScrollableParent(target: Element | null) {
  let node = target as HTMLElement | null

  while (node && node !== document.body) {
    const style = window.getComputedStyle(node)
    const overflowY = style.overflowY
    const canScroll =
      (overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight

    if (canScroll) return true
    node = node.parentElement
  }

  return false
}

export function FullPageScroll() {
  const lockRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const offsetsRafRef = useRef<number | null>(null)
  const rootRef = useRef<HTMLElement | null>(null)
  const sectionsRef = useRef<HTMLElement[]>([])
  const sectionOffsetsRef = useRef<number[]>([])

  useEffect(() => {
    const supportsFullPage = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (!supportsFullPage) return

    rootRef.current = document.querySelector<HTMLElement>("[data-fullpage-root]")
    if (!rootRef.current) return

    const root = document.documentElement
    const body = document.body
    root.classList.add("fullpage-scroll")
    body.classList.add("fullpage-scroll")

    const getSections = () =>
      Array.from(rootRef.current?.children ?? []).filter((child) => {
        const tag = child.tagName.toLowerCase()
        return tag === "section" || tag === "footer"
      }) as HTMLElement[]

    const updateSectionOffsets = () => {
      const sections = sectionsRef.current
      sectionOffsetsRef.current = sections.map(
        (section) => section.getBoundingClientRect().top + window.scrollY,
      )
    }

    const scheduleOffsetsUpdate = () => {
      if (offsetsRafRef.current !== null) {
        window.cancelAnimationFrame(offsetsRafRef.current)
      }
      offsetsRafRef.current = window.requestAnimationFrame(() => {
        offsetsRafRef.current = null
        updateSectionOffsets()
      })
    }

    const updateSections = () => {
      sectionsRef.current = getSections()
      scheduleOffsetsUpdate()
    }

    updateSections()

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleOffsetsUpdate)
    resizeObserver?.observe(rootRef.current)

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(updateSections)
    mutationObserver?.observe(rootRef.current, { childList: true })

    const handleWheel = (event: WheelEvent) => {
      if (lockRef.current) return
      if (event.ctrlKey) return
      if (Math.abs(event.deltaY) < MIN_WHEEL_DELTA) return

      const target = event.target as Element | null
      if (isInteractiveElement(target) || hasScrollableParent(target)) {
        return
      }

      const sections = sectionsRef.current
      if (sections.length === 0) return

      event.preventDefault()
      lockRef.current = true

      const offsets = sectionOffsetsRef.current
      const scrollTop = window.scrollY
      let currentIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY
      for (let i = 0; i < offsets.length; i += 1) {
        const offset = offsets[i]
        if (offset === undefined) continue
        const distance = Math.abs(offset - scrollTop)
        if (distance < closestDistance) {
          closestDistance = distance
          currentIndex = i
        }
      }

      const direction = event.deltaY > 0 ? 1 : -1
      const nextIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction))

      sections[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" })

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        lockRef.current = false
      }, WHEEL_LOCK_MS)
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("resize", scheduleOffsetsUpdate)

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("resize", scheduleOffsetsUpdate)
      root.classList.remove("fullpage-scroll")
      body.classList.remove("fullpage-scroll")
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      if (offsetsRafRef.current !== null) {
        window.cancelAnimationFrame(offsetsRafRef.current)
      }
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return null
}
