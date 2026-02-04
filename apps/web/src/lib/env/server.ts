import "server-only"

const normalizeUrl = (value: string) => value.replace(/\/+$/, "")

function requireServerEnv(label: string, value?: string): string {
  if (!value) {
    throw new Error(`Env não configurada: ${label}`)
  }
  return value
}

export const SERVER_API_URL = normalizeUrl(
  requireServerEnv("API_URL ou NEXT_PUBLIC_API_URL", process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL),
)

export const SERVER_SITE_URL = normalizeUrl(
  requireServerEnv("SITE_URL ou NEXT_PUBLIC_SITE_URL", process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL),
)
