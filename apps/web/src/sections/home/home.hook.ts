import { useCallback } from "react"

export function useHome() {
  const scrollToCharacters = useCallback(() => {
    const element = document.getElementById("characters")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  return {
    scrollToCharacters,
  }
}
