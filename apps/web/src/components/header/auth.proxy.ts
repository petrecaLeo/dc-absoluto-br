import "server-only"

import { NextResponse } from "next/server"

import { SERVER_API_URL } from "@/lib/env/server"
import { bearerHeader, clearAdminSessionCookie, setSessionCookie } from "./auth.cookie"
import { getAdminSessionToken, getSessionToken } from "./auth.server"

type ForwardAuth = "none" | "session" | "admin"

interface ForwardJsonPostOptions {
  auth: ForwardAuth
  // Onde guardar o token devolvido pela API (login, troca de nome/foto).
  storeToken?: (response: NextResponse, token: string) => void
}

function getForwardToken(auth: ForwardAuth) {
  if (auth === "session") return getSessionToken()
  if (auth === "admin") return getAdminSessionToken()
  return Promise.resolve(null)
}

// Repassa um POST JSON para a API. Tokens devolvidos pela API viram cookie HttpOnly e
// nunca chegam ao JavaScript da página.
export async function forwardJsonPost(
  request: Request,
  apiPath: string,
  { auth, storeToken = setSessionCookie }: ForwardJsonPostOptions,
) {
  const authToken = await getForwardToken(auth)

  if (auth !== "none" && !authToken) {
    return NextResponse.json(
      { success: false, message: "Usuário não autenticado." },
      { status: 401 },
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: "Payload inválido." }, { status: 400 })
  }

  try {
    const response = await fetch(`${SERVER_API_URL}${apiPath}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? bearerHeader(authToken) : {}),
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const { token, ...body } = data
    const nextResponse = NextResponse.json(body, { status: response.status })

    if (response.ok && typeof token === "string") {
      storeToken(nextResponse, token)
    }

    if (auth === "admin" && response.status === 401) {
      clearAdminSessionCookie(nextResponse)
    }

    return nextResponse
  } catch {
    return NextResponse.json(
      { success: false, message: "Erro ao conectar com a API." },
      { status: 500 },
    )
  }
}
