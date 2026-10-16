import { setAdminSessionCookie } from "@/components/header/auth.cookie"
import { forwardJsonPost } from "@/components/header/auth.proxy"

export function POST(request: Request) {
  return forwardJsonPost(request, "/api/admin/login", {
    auth: "none",
    storeToken: setAdminSessionCookie,
    tokenScope: "admin",
    // Só aparece depois de e-mail e senha de admin corretos, então pode dar a pista de configuração.
    invalidTokenMessage:
      "Login aceito, mas o site recusou a sessão. Confira se o AUTH_SECRET é o mesmo na Vercel e no Render.",
  })
}
