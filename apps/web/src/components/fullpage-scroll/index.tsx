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
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    rootRef.current = document.querySelector<HTMLElement>("[data-fullpage-root]")

    const root = document.documentElement
    const body = document.body
    root.classList.add("fullpage-scroll")
    body.classList.add("fullpage-scroll")

    const getSections = () => {
      if (!rootRef.current) return []
      return Array.from(rootRef.current.children).filter((child) => {
        const tag = child.tagName.toLowerCase()
        return tag === "section" || tag === "footer"
      }) as HTMLElement[]
    }

    const handleWheel = (event: WheelEvent) => {
      if (lockRef.current) return
      if (event.ctrlKey) return
      if (Math.abs(event.deltaY) < MIN_WHEEL_DELTA) return

      const target = event.target as Element | null
      if (isInteractiveElement(target) || hasScrollableParent(target)) {
        return
      }

      const sections = getSections()
      if (sections.length === 0) return

      event.preventDefault()
      lockRef.current = true

      const currentIndex = sections.reduce((closestIndex, section, index) => {
        const closestSection = sections[closestIndex]
        if (!closestSection) return index
        const offset = Math.abs(section.getBoundingClientRect().top)
        const closestOffset = Math.abs(closestSection.getBoundingClientRect().top)
        return offset < closestOffset ? index : closestIndex
      }, 0)

      const direction = event.deltaY > 0 ? 1 : -1
      const nextIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction))

      sections[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" })

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        lockRef.current = false
      }, WHEEL_LOCK_MS)
    }

    window.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      window.removeEventListener("wheel", handleWheel)
      root.classList.remove("fullpage-scroll")
      body.classList.remove("fullpage-scroll")
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return null
}
