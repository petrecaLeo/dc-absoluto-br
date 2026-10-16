// Tokens de sessão assinados com HMAC-SHA256 via Web Crypto (funciona no Bun e no Node).
// Formato: v1.<payload base64url>.<assinatura base64url>
// Só deve ser importado em código de servidor: quem tem o segredo consegue emitir sessões.

export type SessionScope = "user" | "admin"

export interface SessionClaimsInput {
  scope: SessionScope
  sub: string
  email: string
  name: string
  profileImage: string | null
  createdAt: string | null
}

export interface SessionClaims extends SessionClaimsInput {
  iat: number
  exp: number
}

export const SESSION_COOKIE_KEY = "dcabsoluto.session"
export const ADMIN_SESSION_COOKIE_KEY = "dcabsoluto.admin"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
export const ADMIN_SESSION_TTL_SECONDS = 60 * 30
export const MIN_SESSION_SECRET_LENGTH = 32

const TOKEN_VERSION = "v1"
const MAX_TOKEN_LENGTH = 4096
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const keyCache = new Map<string, Promise<CryptoKey>>()

export function isValidSessionSecret(secret: unknown): secret is string {
  return typeof secret === "string" && secret.length >= MIN_SESSION_SECRET_LENGTH
}

function getKey(secret: string) {
  let key = keyCache.get(secret)
  if (!key) {
    key = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    )
    keyCache.set(secret, key)
  }
  return key
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!BASE64URL_PATTERN.test(value)) return null
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)

  try {
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

function parseClaims(raw: unknown): SessionClaims | null {
  if (!raw || typeof raw !== "object") return null
  const claims = raw as Record<string, unknown>

  if (claims.scope !== "user" && claims.scope !== "admin") return null
  if (!isNonEmptyString(claims.sub) || !isNonEmptyString(claims.email)) return null
  if (typeof claims.name !== "string") return null
  if (claims.profileImage !== null && typeof claims.profileImage !== "string") return null
  if (claims.createdAt !== null && typeof claims.createdAt !== "string") return null
  if (!Number.isFinite(claims.iat) || !Number.isFinite(claims.exp)) return null

  return {
    scope: claims.scope,
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    profileImage: claims.profileImage,
    createdAt: claims.createdAt,
    iat: claims.iat as number,
    exp: claims.exp as number,
  }
}

export async function createSessionToken(
  input: SessionClaimsInput,
  secret: string,
  ttlSeconds: number,
  now: number = Date.now(),
): Promise<string> {
  if (!isValidSessionSecret(secret)) {
    throw new Error(
      `Segredo de sessão precisa ter ao menos ${MIN_SESSION_SECRET_LENGTH} caracteres`,
    )
  }

  const iat = Math.floor(now / 1000)
  const claims: SessionClaims = {
    scope: input.scope,
    sub: input.sub,
    email: input.email,
    name: input.name,
    profileImage: input.profileImage,
    createdAt: input.createdAt,
    iat,
    exp: iat + ttlSeconds,
  }

  const signingInput = `${TOKEN_VERSION}.${toBase64Url(encoder.encode(JSON.stringify(claims)))}`
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(secret),
    encoder.encode(signingInput),
  )

  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifySessionToken(
  token: string | null | undefined,
  secret: string | null | undefined,
  expectedScope: SessionScope,
  now: number = Date.now(),
): Promise<SessionClaims | null> {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return null
  }
  if (!isValidSessionSecret(secret)) return null

  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [version, payloadSegment, signatureSegment] = parts as [string, string, string]
  if (version !== TOKEN_VERSION) return null

  const signature = fromBase64Url(signatureSegment)
  if (!signature) return null

  try {
    // crypto.subtle.verify compara a assinatura em tempo constante.
    const isValid = await crypto.subtle.verify(
      "HMAC",
      await getKey(secret),
      signature,
      encoder.encode(`${version}.${payloadSegment}`),
    )
    if (!isValid) return null

    const payload = fromBase64Url(payloadSegment)
    if (!payload) return null

    const claims = parseClaims(JSON.parse(decoder.decode(payload)))
    if (!claims || claims.scope !== expectedScope) return null
    if (claims.exp * 1000 <= now) return null

    return claims
  } catch {
    return null
  }
}
