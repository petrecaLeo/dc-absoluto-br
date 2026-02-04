const DEFAULT_SITE_URL = "http://localhost:3000"

export const SITE_NAME = "DC Absoluto BR"
export const SITE_DESCRIPTION =
  "Catalogo de HQs do Universo Absolute da DC em portugues"
export const SITE_LOCALE = "pt_BR"
export const DEFAULT_OG_IMAGE = "/images/home/home-1.webp"

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL

  if (!envUrl) {
    return DEFAULT_SITE_URL
  }

  return envUrl.replace(/\/+$/, "")
}

export function getSiteMetadataBase(): URL {
  return new URL(getSiteUrl())
}
