import { NextResponse } from "next/server"

import { bearerHeader } from "@/components/header/auth.cookie"
import { getSessionToken } from "@/components/header/auth.server"
import { SERVER_API_URL } from "@/lib/env/server"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(_: Request, { params }: RouteContext) {
  const sessionToken = await getSessionToken()
  const { id } = await params

  if (!sessionToken) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/comics/${id}/read`, {
      method: "POST",
      cache: "no-store",
      headers: bearerHeader(sessionToken),
    })

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
