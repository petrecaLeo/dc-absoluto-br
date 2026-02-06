import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { AUTH_COOKIE_KEY } from "@/components/header/auth.cookie"
import { SERVER_API_URL } from "@/lib/env/server"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(_: Request, { params }: RouteContext) {
  const cookieStore = await cookies()
  const authCookieValue = cookieStore.get(AUTH_COOKIE_KEY)?.value
  const { id } = await params

  if (!authCookieValue) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/comics/${id}/read`, {
      method: "POST",
      cache: "no-store",
      headers: {
        cookie: `${AUTH_COOKIE_KEY}=${authCookieValue}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
