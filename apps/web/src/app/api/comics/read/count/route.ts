import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { AUTH_COOKIE_KEY } from "@/components/header/auth.cookie"
import { SERVER_API_URL } from "@/lib/env/server"

export async function GET() {
  const cookieStore = await cookies()
  const authCookieValue = cookieStore.get(AUTH_COOKIE_KEY)?.value

  if (!authCookieValue) {
    return NextResponse.json({ data: { count: 0 } }, { status: 401 })
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/comics/read/count`, {
      cache: "no-store",
      headers: {
        cookie: `${AUTH_COOKIE_KEY}=${authCookieValue}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ data: { count: 0 } }, { status: response.status })
    }

    const payload = await response.json()
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ data: { count: 0 } }, { status: 500 })
  }
}
