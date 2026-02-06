const AUTH_COOKIE_KEY = "dcabsoluto.auth"

export interface AuthUser {
  id: string
  name: string
  email: string
}

function parseCookieHeader(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  header.split(";").forEach((part) => {
    const [rawName, ...rest] = part.trim().split("=")
    if (!rawName) return
    cookies[rawName] = rest.join("=")
  })

  return cookies
}

export function getAuthUserFromRequest(request: Request): AuthUser | null {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  const cookies = parseCookieHeader(cookieHeader)
  const rawValue = cookies[AUTH_COOKIE_KEY]
  if (!rawValue) return null

  try {
    const decoded = decodeURIComponent(rawValue)
    const parsed = JSON.parse(decoded) as Partial<AuthUser>

    if (!parsed || typeof parsed.id !== "string") return null
    if (typeof parsed.name !== "string") return null
    if (typeof parsed.email !== "string") return null

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
    }
  } catch {
    return null
  }
}
