import "server-only"

import {
  ADMIN_SESSION_COOKIE_KEY,
  ADMIN_SESSION_TTL_SECONDS,
  SESSION_COOKIE_KEY,
  SESSION_TTL_SECONDS,
} from "@dc-absoluto/shared-types/session-token"
import type { NextResponse } from "next/server"

// Cookie antigo (JSON sem assinatura) que o navegador ainda pode ter guardado.
const LEGACY_AUTH_COOKIE_KEY = "dcabsoluto.auth"

const isProduction = process.env.NODE_ENV === "production"

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_KEY, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_KEY, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  response.cookies.set(LEGACY_AUTH_COOKIE_KEY, "", { path: "/", maxAge: 0 })
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE_KEY, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  })
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE_KEY, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })
}

export function bearerHeader(token: string) {
  return { authorization: `Bearer ${token}` }
}
