import type { AuthUser } from "./auth.types"
import { parseAuthUser } from "./auth.validation"

// Cópia do usuário só para exibição (nome, foto). A sessão de verdade fica num cookie HttpOnly
// assinado pelo servidor, que o JavaScript da página não consegue ler nem forjar.
const STORAGE_KEY = "dcabsoluto.user"
const LEGACY_STORAGE_KEY = "dcabsoluto.auth"
const AUTH_EVENT = "dcabsoluto:auth"

let hasRemovedLegacyState = false

function removeLegacyAuthState() {
  if (hasRemovedLegacyState) return
  hasRemovedLegacyState = true
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  document.cookie = `${LEGACY_STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`
}

function emitAuthChange(user: AuthUser | null) {
  window.dispatchEvent(new CustomEvent<AuthUser | null>(AUTH_EVENT, { detail: user }))
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null

  try {
    removeLegacyAuthState()
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
  emitAuthChange(user)
}

export function clearStoredUser() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  emitAuthChange(null)
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch {
    // Mesmo sem resposta do servidor, a interface precisa refletir o logout.
  } finally {
    clearStoredUser()
  }
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
