import {
  ADMIN_SESSION_COOKIE_KEY,
  ADMIN_SESSION_TTL_SECONDS,
  MIN_SESSION_SECRET_LENGTH,
  SESSION_COOKIE_KEY,
  SESSION_TTL_SECONDS,
  type SessionClaims,
  type SessionScope,
  createSessionToken,
  isValidSessionSecret,
  verifySessionToken,
} from "@dc-absoluto/shared-types/session-token"

const TEST_AUTH_SECRET = "dc-absoluto-segredo-de-teste-nao-usar-em-producao"

function resolveAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "test" ? TEST_AUTH_SECRET : undefined)

  if (!isValidSessionSecret(secret)) {
    throw new Error(
      `AUTH_SECRET não configurada ou com menos de ${MIN_SESSION_SECRET_LENGTH} caracteres. Gere uma com: openssl rand -base64 48`,
    )
  }

  return secret
}

const AUTH_SECRET = resolveAuthSecret()

export function getAuthSecret() {
  return AUTH_SECRET
}

export interface AuthUser {
  id: string
  name: string
  email: string
  profileImage?: string | null
  createdAt?: string | null
}

interface SessionUser {
  id: string
  name: string
  email: string
  profileImage?: string | null
  createdAt?: Date | string | null
}

function parseCookieHeader(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=")
    if (!rawName) continue
    cookies[rawName] = rest.join("=")
  }

  return cookies
}

function getRequestToken(request: Request, cookieKey: string): string | null {
  const authorization = request.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim() || null
  }

  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  return parseCookieHeader(cookieHeader)[cookieKey] ?? null
}

export async function getAuthUserFromRequest(request: Request): Promise<AuthUser | null> {
  const claims = await verifySessionToken(
    getRequestToken(request, SESSION_COOKIE_KEY),
    AUTH_SECRET,
    "user",
  )
  if (!claims) return null

  return {
    id: claims.sub,
    name: claims.name,
    email: claims.email,
    profileImage: claims.profileImage,
    createdAt: claims.createdAt,
  }
}

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null
}

export async function getAdminFromRequest(request: Request): Promise<SessionClaims | null> {
  const adminEmail = getAdminEmail()
  if (!adminEmail) return null

  const claims = await verifySessionToken(
    getRequestToken(request, ADMIN_SESSION_COOKIE_KEY),
    AUTH_SECRET,
    "admin",
  )
  if (!claims || claims.email !== adminEmail) return null

  return claims
}

function createTokenFor(scope: SessionScope, user: SessionUser, ttlSeconds: number) {
  const createdAt = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt

  return createSessionToken(
    {
      scope,
      sub: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage ?? null,
      createdAt: createdAt ?? null,
    },
    AUTH_SECRET,
    ttlSeconds,
  )
}

export function createUserSessionToken(user: SessionUser) {
  return createTokenFor("user", user, SESSION_TTL_SECONDS)
}

export function createAdminSessionToken(user: SessionUser) {
  return createTokenFor("admin", user, ADMIN_SESSION_TTL_SECONDS)
}
