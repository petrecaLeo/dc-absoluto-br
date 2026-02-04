"use client"

import { useCallback, useEffect, useState } from "react"

const SCROLL_THRESHOLD = 10

const menuItems = [
  { label: "PERSONAGENS", href: "#characters" },
  { label: "O COMEÇO", href: "#where-to-start" },
  { label: "NEWSLETTER", href: "#newsletter" },
  { label: "REPORTES", href: "#report" },
]

export function useHeader() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY

    if (currentScrollY <= 0) {
      setIsVisible(true)
    } else if (currentScrollY > lastScrollY + SCROLL_THRESHOLD) {
      setIsVisible(false)
    } else if (currentScrollY < lastScrollY - SCROLL_THRESHOLD) {
      setIsVisible(true)
    }

    setLastScrollY(currentScrollY)
  }, [lastScrollY])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    element?.scrollIntoView({ behavior: "smooth" })
  }

  return {
    isVisible,
    menuItems,
    scrollToTop,
    handleNavClick,
  }
}
