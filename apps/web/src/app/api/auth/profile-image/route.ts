import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { AUTH_COOKIE_KEY } from "@/components/header/auth.cookie"
import { SERVER_API_URL } from "@/lib/env/server"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const authCookieValue = cookieStore.get(AUTH_COOKIE_KEY)?.value

  if (!authCookieValue) {
    return NextResponse.json(
      { success: false, message: "Usuario nao autenticado." },
      { status: 401 },
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "Payload invalido." },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/auth/profile-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${AUTH_COOKIE_KEY}=${authCookieValue}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))

    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { success: false, message: "Erro ao conectar com a API." },
      { status: 500 },
    )
  }
}
