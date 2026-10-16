import { setAdminSessionCookie } from "@/components/header/auth.cookie"
import { forwardJsonPost } from "@/components/header/auth.proxy"

export function POST(request: Request) {
  return forwardJsonPost(request, "/api/admin/login", {
    auth: "none",
    storeToken: setAdminSessionCookie,
  })
}
