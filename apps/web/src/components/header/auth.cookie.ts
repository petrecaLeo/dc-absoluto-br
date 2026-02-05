import type { AuthUser } from "./auth.types"
import { parseAuthUser } from "./auth.validation"

export const AUTH_COOKIE_KEY = "dcabsoluto.auth"

export function encodeAuthCookie(user: AuthUser): string {
  return encodeURIComponent(JSON.stringify(user))
}

export function decodeAuthCookie(value?: string): AuthUser | null {
  if (!value) return null

  try {
    const decoded = decodeURIComponent(value)
    return parseAuthUser(JSON.parse(decoded))
  } catch {
    return null
  }
}
