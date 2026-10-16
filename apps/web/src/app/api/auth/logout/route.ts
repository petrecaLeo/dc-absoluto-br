import { NextResponse } from "next/server"

import { clearSessionCookie } from "@/components/header/auth.cookie"
import { crossSiteRequestResponse, isSameOriginRequest } from "@/lib/request-origin"

export function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossSiteRequestResponse()

  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
