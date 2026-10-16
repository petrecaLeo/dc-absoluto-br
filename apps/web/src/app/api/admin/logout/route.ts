import { NextResponse } from "next/server"

import { clearAdminSessionCookie } from "@/components/header/auth.cookie"

export function POST() {
  const response = NextResponse.json({ success: true })
  clearAdminSessionCookie(response)
  return response
}
