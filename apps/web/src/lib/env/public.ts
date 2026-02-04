const normalizeUrl = (value: string) => value.replace(/\/+$/, "")

function requirePublicEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Env não configurada: ${name}`)
  }
  return value
}

export const PUBLIC_API_URL = normalizeUrl(requirePublicEnv("NEXT_PUBLIC_API_URL"))
export const PUBLIC_SITE_URL = normalizeUrl(requirePublicEnv("NEXT_PUBLIC_SITE_URL"))
