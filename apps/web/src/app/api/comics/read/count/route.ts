import { NextResponse } from "next/server"

import { bearerHeader } from "@/components/header/auth.cookie"
import { getSessionToken } from "@/components/header/auth.server"
import { SERVER_API_URL } from "@/lib/env/server"

export async function GET(request: Request) {
  const sessionToken = await getSessionToken()

  if (!sessionToken) {
    return NextResponse.json({ data: { count: 0 } }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const universe = searchParams.get("universe")
    const nextSearchParams = new URLSearchParams()
    if (universe) {
      nextSearchParams.set("universe", universe)
    }

    const response = await fetch(
      `${SERVER_API_URL}/api/comics/read/count${
        nextSearchParams.size > 0 ? `?${nextSearchParams.toString()}` : ""
      }`,
      {
        cache: "no-store",
        headers: bearerHeader(sessionToken),
      },
    )

    if (!response.ok) {
      return NextResponse.json({ data: { count: 0 } }, { status: response.status })
    }

    const payload = await response.json()
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ data: { count: 0 } }, { status: 500 })
  }
}
