"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import type { AuthUser } from "./auth.types"
import { clearStoredUser, getStoredUser, storeUser, subscribeAuthChanges } from "./auth.storage"
import { useHeader } from "./header.hook"
import { LoginModal } from "./login-modal"

interface HeaderClientProps {
  initialAuthUser?: AuthUser | null
}

export function HeaderClient({ initialAuthUser = null }: HeaderClientProps) {
  const { isVisible, menuItems, scrollToTop, handleNavClick } = useHeader()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialAuthUser ?? null)
  const desktopProfileRef = useRef<HTMLLIElement>(null)
  const mobileProfileRef = useRef<HTMLDivElement>(null)
  const mobileLinkTabIndex = isMenuOpen ? 0 : -1

  const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    handleNavClick(e, href)
    setIsMenuOpen(false)
    setIsProfileOpen(false)
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

  useEffect(() => {
    if (!authUser) {
      setIsProfileOpen(false)
    }
  }, [authUser])

  useEffect(() => {
    if (!isProfileOpen) return

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (desktopProfileRef.current?.contains(target)) return
      if (mobileProfileRef.current?.contains(target)) return
      setIsProfileOpen(false)
    }

    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("touchstart", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("touchstart", handleOutsideClick)
    }
  }, [isProfileOpen])

  const handleAuthSuccess = (user: AuthUser) => {
    storeUser(user)
    setAuthUser(user)
  }

  const handleLogout = () => {
    clearStoredUser()
    setAuthUser(null)
    setIsProfileOpen(false)
    setIsMenuOpen(false)
  }

  const handleProfileNavigate = () => {
    setIsProfileOpen(false)
    setIsMenuOpen(false)
  }

  const firstName = authUser?.name.trim().split(/\s+/)[0] || "Heroi"
  const profileTabIndex = isProfileOpen ? 0 : -1
  const mobileProfileTabIndex = isMenuOpen && isProfileOpen ? 0 : -1

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
              onClick={() => {
                setIsProfileOpen(false)
                scrollToTop()
              }}
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
                      onClick={(e) => {
                        setIsProfileOpen(false)
                        handleNavClick(e, item.href)
                      }}
                      className="group relative text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-dc-blue"
                    >
                      {item.label}
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                    </a>
                  </li>
                ))}
                <li className="relative" ref={desktopProfileRef}>
                  {authUser ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsProfileOpen((prev) => !prev)}
                        aria-expanded={isProfileOpen}
                        aria-haspopup="menu"
                        className="group relative cursor-pointer text-sm uppercase font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-white"
                      >
                        {firstName}
                        <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                      </button>
                      <div
                        className={`absolute right-0 top-full mt-3 w-max min-w-[8.5rem] origin-top-right transform-gpu rounded-xl bg-dc-black/95 p-3 text-right shadow-xl backdrop-blur-lg transition-all duration-200 ease-out ${
                          isProfileOpen
                            ? "translate-y-0 opacity-100"
                            : "pointer-events-none -translate-y-2 opacity-0"
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <a
                            href="/perfil"
                            onClick={handleProfileNavigate}
                            tabIndex={profileTabIndex}
                            className="group relative text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-dc-blue"
                          >
                            PERFIL
                            <span className="absolute -bottom-1 right-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                          </a>
                          <button
                            type="button"
                            onClick={handleLogout}
                            tabIndex={profileTabIndex}
                            className="group flex cursor-pointer items-center justify-end gap-2 text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-white"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="currentColor"
                            >
                              <path d="M16 17v-1h-4v-2h4v-1l3 2-3 2zM4 4h8a2 2 0 0 1 2 2v3h-2V6H4v12h8v-3h2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                            </svg>
                            SAIR
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        setIsLoginOpen(true)
                      }}
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
                onClick={() => {
                  setIsProfileOpen(false)
                  setIsMenuOpen((prev) => !prev)
                }}
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
                  <div className="flex flex-col items-end gap-3" ref={mobileProfileRef}>
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen((prev) => !prev)}
                      aria-expanded={isProfileOpen}
                      aria-haspopup="menu"
                      className="group relative cursor-pointer text-sm uppercase font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-white"
                    >
                      {firstName}
                      <span className="absolute -bottom-1 right-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                    </button>
                    <div
                      className={`w-max min-w-[8.5rem] origin-top-right transform-gpu rounded-xl bg-dc-black/95 p-3 text-right shadow-xl backdrop-blur-lg transition-all duration-200 ease-out ${
                        isProfileOpen
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-2 opacity-0"
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <a
                          href="/perfil"
                          onClick={handleProfileNavigate}
                          tabIndex={mobileProfileTabIndex}
                          className="group relative text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-dc-blue"
                        >
                          PERFIL
                          <span className="absolute -bottom-1 right-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
                        </a>
                        <button
                          type="button"
                          onClick={handleLogout}
                          tabIndex={mobileProfileTabIndex}
                          className="group flex cursor-pointer items-center justify-end gap-2 text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-white"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="currentColor"
                          >
                            <path d="M16 17v-1h-4v-2h4v-1l3 2-3 2zM4 4h8a2 2 0 0 1 2 2v3h-2V6H4v12h8v-3h2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                          </svg>
                          SAIR
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false)
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
