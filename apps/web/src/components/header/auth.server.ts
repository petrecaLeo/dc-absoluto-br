import { cookies } from "next/headers"

import { AUTH_COOKIE_KEY, decodeAuthCookie } from "./auth.cookie"
import type { AuthUser } from "./auth.types"

export async function getServerAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(AUTH_COOKIE_KEY)?.value
  return decodeAuthCookie(cookieValue)
}
