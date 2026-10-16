import { NextResponse } from "next/server"

import { clearSessionCookie } from "@/components/header/auth.cookie"

export function POST() {
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
