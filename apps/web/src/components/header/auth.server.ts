import "server-only"

import {
  ADMIN_SESSION_COOKIE_KEY,
  SESSION_COOKIE_KEY,
  type SessionClaims,
  verifySessionToken,
} from "@dc-absoluto/shared-types/session-token"
import { cookies } from "next/headers"

import { getServerAuthSecret } from "@/lib/env/server"
import type { AuthUser } from "./auth.types"

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_KEY)?.value ?? null
}

export async function getAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_SESSION_COOKIE_KEY)?.value ?? null
}

export async function getServerAuthUser(): Promise<AuthUser | null> {
  const claims = await verifySessionToken(await getSessionToken(), getServerAuthSecret(), "user")
  if (!claims) return null

  return {
    id: claims.sub,
    name: claims.name,
    email: claims.email,
    profileImage: claims.profileImage,
    createdAt: claims.createdAt,
  }
}

export async function getServerAdminSession(): Promise<SessionClaims | null> {
  return verifySessionToken(await getAdminSessionToken(), getServerAuthSecret(), "admin")
}
