const normalizeUrl = (value: string) => value.replace(/\/+$/, "")

function requirePublicEnv(label: string, value?: string): string {
  if (!value) {
    throw new Error(`Env não configurada: ${label}`)
  }
  return value
}

// Use explicit env access so Next can inline NEXT_PUBLIC_* values in the client bundle.
export const PUBLIC_API_URL = normalizeUrl(
  requirePublicEnv("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL),
)
export const PUBLIC_SITE_URL = normalizeUrl(
  requirePublicEnv("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL),
)
