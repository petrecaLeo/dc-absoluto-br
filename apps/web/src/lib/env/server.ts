import "server-only"

import { isValidSessionSecret } from "@dc-absoluto/shared-types/session-token"

const normalizeUrl = (value: string) => value.replace(/\/+$/, "")

function requireServerEnv(label: string, value?: string): string {
  if (!value) {
    throw new Error(`Env não configurada: ${label}`)
  }
  return value
}

export const SERVER_API_URL = normalizeUrl(
  requireServerEnv(
    "API_URL ou NEXT_PUBLIC_API_URL",
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  ),
)

export const SERVER_SITE_URL = normalizeUrl(
  requireServerEnv(
    "SITE_URL ou NEXT_PUBLIC_SITE_URL",
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  ),
)

let hasWarnedInvalidAuthSecret = false

// Sem segredo válido, toda sessão é tratada como deslogada (falha fechada).
export function getServerAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET
  if (isValidSessionSecret(secret)) return secret

  if (!hasWarnedInvalidAuthSecret) {
    console.error("AUTH_SECRET ausente ou com menos de 32 caracteres: sessões serão recusadas.")
    hasWarnedInvalidAuthSecret = true
  }
  return null
}
