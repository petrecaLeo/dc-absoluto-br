import "server-only"

import { NextResponse } from "next/server"

import { SERVER_SITE_URL } from "@/lib/env/server"

function getHost(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

// Defesa extra contra CSRF, além do SameSite dos cookies: rotas que mudam estado só aceitam
// requisições disparadas pelo próprio site. Navegadores mandam Origin e Sec-Fetch-Site em todo POST;
// sem nenhum dos dois, quem chamou não é um navegador (e CSRF depende de um).
export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false

  const origin = request.headers.get("origin")
  if (!origin) return true

  const originHost = getHost(origin)
  if (!originHost) return false

  return [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    getHost(SERVER_SITE_URL),
  ].includes(originHost)
}

export function crossSiteRequestResponse() {
  return NextResponse.json(
    { success: false, message: "Requisição não permitida." },
    { status: 403 },
  )
}
