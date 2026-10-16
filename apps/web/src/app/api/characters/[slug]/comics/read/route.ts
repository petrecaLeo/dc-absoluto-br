import { NextResponse } from "next/server"

import { bearerHeader } from "@/components/header/auth.cookie"
import { getSessionToken } from "@/components/header/auth.server"
import { SERVER_API_URL } from "@/lib/env/server"

interface RouteContext {
  params: Promise<{
    slug: string
  }>
}

export async function GET(_: Request, { params }: RouteContext) {
  const sessionToken = await getSessionToken()
  const { slug } = await params

  if (!sessionToken) {
    return NextResponse.json({ data: [] }, { status: 401 })
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/characters/${slug}/comics/read`, {
      cache: "no-store",
      headers: bearerHeader(sessionToken),
    })

    if (!response.ok) {
      return NextResponse.json({ data: [] }, { status: response.status })
    }

    const payload = await response.json()
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}
