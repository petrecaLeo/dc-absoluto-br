import { NextResponse } from "next/server"

import { bearerHeader } from "@/components/header/auth.cookie"
import { getSessionToken } from "@/components/header/auth.server"
import { SERVER_API_URL } from "@/lib/env/server"

export async function GET() {
  const sessionToken = await getSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ data: [], userCreatedAt: null }, { status: 401 })
  }

  try {
    const response = await fetch(`${SERVER_API_URL}/api/comics/read/top-characters`, {
      cache: "no-store",
      headers: bearerHeader(sessionToken),
    })

    if (!response.ok) {
      return NextResponse.json({ data: [], userCreatedAt: null }, { status: response.status })
    }

    const payload = await response.json()
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ data: [], userCreatedAt: null }, { status: 500 })
  }
}
