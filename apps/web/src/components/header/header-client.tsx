"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import type { AuthUser } from "./auth.types"
import { getStoredUser, storeUser, subscribeAuthChanges } from "./auth.storage"
import { useHeader } from "./header.hook"
import { LoginModal } from "./login-modal"

interface HeaderClientProps {
  initialAuthUser?: AuthUser | null
}

export function HeaderClient({ initialAuthUser = null }: HeaderClientProps) {
  const { isVisible, menuItems, scrollToTop, handleNavClick } = useHeader()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialAuthUser ?? null)
  const mobileLinkTabIndex = isMenuOpen ? 0 : -1

  const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    handleNavClick(e, href)
    setIsMenuOpen(false)
  }

  useEffect(() => {
    if (initialAuthUser) {
      storeUser(initialAuthUser)
    } else {
      const storedUser = getStoredUser()
      if (storedUser) {
        storeUser(storedUser)
        setAuthUser(storedUser)
      }
    }

    const unsubscribe = subscribeAuthChanges(setAuthUser)
    return () => unsubscribe()
  }, [initialAuthUser])

  const handleAuthSuccess = (user: AuthUser) => {
    storeUser(user)
    setAuthUser(user)
  }

  const firstName = authUser?.name.trim().split(/\s+/)[0] || "Heroi"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="bg-dc-black/30 backdrop-blur-lg border-b border-white/5">
        <div className="relative px-4 py-2 sm:px-10">
          <nav className="flex items-center justify-between">
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Voltar ao topo"
              className="shrink-0 cursor-pointer"
            >
              <Image
                src="/images/logo.png"
                alt="DC Absoluto BR"
                width={150}
                height={50}
                className="h-15 w-auto"
                priority
              />
            </button>

            <div className="flex items-center gap-4">
              <ul className="hidden items-center gap-10 lg:flex">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="group relative text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-dc-blue"
                    >
                      {item.label}
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                    </a>
                  </li>
                ))}
                <li>
                  {authUser ? (
                    <span className="text-sm uppercase font-semibold tracking-wider text-white/80">
                      Olá, {firstName}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsLoginOpen(true)}
                      className="group relative cursor-pointer text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-white"
                    >
                      LOGIN
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                    </button>
                  )}
                </li>
              </ul>

              <button
                type="button"
                aria-label="Abrir menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors duration-200 hover:border-white/20 hover:bg-white/10 lg:hidden"
              >
                <span className="sr-only">Menu</span>
                <span className="flex flex-col gap-1">
                  <span
                    className={`h-0.5 w-6 rounded-full bg-white transition-transform duration-200 ${
                      isMenuOpen ? "translate-y-1.5 rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`h-0.5 w-6 rounded-full bg-white transition-opacity duration-200 ${
                      isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`h-0.5 w-6 rounded-full bg-white transition-transform duration-200 ${
                      isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
            </div>
          </nav>

          <div
            id="mobile-menu"
            aria-hidden={!isMenuOpen}
            className={`absolute right-4 top-full mt-3 w-56 origin-top-right transform-gpu rounded-xl bg-dc-black/95 p-4 text-right shadow-xl backdrop-blur-lg transition-all duration-300 ease-out lg:hidden ${
              isMenuOpen
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-full opacity-0"
            }`}
          >
            <ul className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => handleMobileNavClick(e, item.href)}
                    tabIndex={mobileLinkTabIndex}
                    className="group relative text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-dc-blue"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 right-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                  </a>
                </li>
              ))}
              <li className="border-t border-white/10 pt-3">
                {authUser ? (
                  <span className="block uppercase text-sm font-semibold tracking-wider text-white/80">
                    Olá, {firstName}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsLoginOpen(true)
                    }}
                    tabIndex={mobileLinkTabIndex}
                    className="group relative w-full cursor-pointer text-right text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-white"
                  >
                    LOGIN
                    <span className="absolute -bottom-1 right-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </header>
  )
}
