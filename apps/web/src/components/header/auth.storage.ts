import { AUTH_COOKIE_KEY, encodeAuthCookie } from "./auth.cookie"
import type { AuthUser } from "./auth.types"
import { parseAuthUser } from "./auth.validation"

const STORAGE_KEY = "dcabsoluto.auth"
const AUTH_EVENT = "dcabsoluto:auth"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function setAuthCookie(value: string) {
  if (typeof window === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${AUTH_COOKIE_KEY}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

function clearAuthCookie() {
  if (typeof window === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    return parseAuthUser(JSON.parse(raw))
  } catch {
    return null
  }
}

export function storeUser(user: AuthUser) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  setAuthCookie(encodeAuthCookie(user))
  window.dispatchEvent(new CustomEvent<AuthUser | null>(AUTH_EVENT, { detail: user }))
}

export function clearStoredUser() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  clearAuthCookie()
  window.dispatchEvent(new CustomEvent<AuthUser | null>(AUTH_EVENT, { detail: null }))
}

export function subscribeAuthChanges(callback: (user: AuthUser | null) => void) {
  if (typeof window === "undefined") return () => {}

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AuthUser | null>).detail ?? null
    callback(detail)
  }

  window.addEventListener(AUTH_EVENT, handler)
  return () => window.removeEventListener(AUTH_EVENT, handler)
}
