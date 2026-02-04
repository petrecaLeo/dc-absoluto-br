import { SERVER_SITE_URL } from "@/lib/env/server"

export const SITE_NAME = "DC Absoluto BR"
export const SITE_DESCRIPTION =
  "Catalogo de HQs do Universo Absolute da DC em portugues"
export const SITE_LOCALE = "pt_BR"
export const DEFAULT_OG_IMAGE = "/images/home/home-1.webp"

export function getSiteUrl(): string {
  return SERVER_SITE_URL
}

export function getSiteMetadataBase(): URL {
  return new URL(getSiteUrl())
}
