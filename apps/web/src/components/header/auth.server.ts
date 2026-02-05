import { cookies } from "next/headers"

import { AUTH_COOKIE_KEY, decodeAuthCookie } from "./auth.cookie"
import type { AuthUser } from "./auth.types"

export function getServerAuthUser(): AuthUser | null {
  const cookieValue = cookies().get(AUTH_COOKIE_KEY)?.value
  return decodeAuthCookie(cookieValue)
}
