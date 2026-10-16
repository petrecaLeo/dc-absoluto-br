import "server-only"

import { type SessionScope, verifySessionToken } from "@dc-absoluto/shared-types/session-token"
import { NextResponse } from "next/server"

import { SERVER_API_URL, getServerAuthSecret } from "@/lib/env/server"
import { bearerHeader, clearAdminSessionCookie, setSessionCookie } from "./auth.cookie"
import { getAdminSessionToken, getSessionToken } from "./auth.server"

type ForwardAuth = "none" | "session" | "admin"

const DEFAULT_INVALID_TOKEN_MESSAGE =
  "Não foi possível iniciar a sessão. Tente novamente mais tarde."

interface ForwardJsonPostOptions {
  auth: ForwardAuth
  // Onde guardar o token devolvido pela API (login, troca de nome/foto).
  storeToken?: (response: NextResponse, token: string) => void
  // Escopo que o token devolvido precisa ter para ser guardado.
  tokenScope?: SessionScope
  // Mensagem quando o site não consegue validar o token devolvido pela API.
  invalidTokenMessage?: string
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
  {
    auth,
    storeToken = setSessionCookie,
    tokenScope = "user",
    invalidTokenMessage = DEFAULT_INVALID_TOKEN_MESSAGE,
  }: ForwardJsonPostOptions,
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
      // Só guarda o que o site consegue validar. Com AUTH_SECRET diferente entre API e web,
      // o login "daria certo" na API e a sessão seria recusada logo em seguida pelo site.
      const claims = await verifySessionToken(token, getServerAuthSecret(), tokenScope)
      if (!claims) {
        console.error(
          `Token devolvido por ${apiPath} não foi validado pelo site: confira se o AUTH_SECRET é o mesmo na API e no web.`,
        )
        return NextResponse.json({ success: false, message: invalidTokenMessage }, { status: 502 })
      }

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
