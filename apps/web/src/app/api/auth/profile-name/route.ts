import { forwardJsonPost } from "@/components/header/auth.proxy"

export function POST(request: Request) {
  return forwardJsonPost(request, "/api/auth/profile-name", { auth: "session" })
}
