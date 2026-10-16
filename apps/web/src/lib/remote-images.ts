// Domínios de imagem que o next/image otimiza (usado também pelo next.config.ts).
// Capas de outros domínios são exibidas sem otimização, para nunca derrubar a página.
export const OPTIMIZED_IMAGE_HOSTNAMES = ["static.dc.com", "static.wikia.nocookie.net"]

export function isOptimizedImageUrl(src: string): boolean {
  try {
    const { protocol, hostname } = new URL(src)
    return protocol === "https:" && OPTIMIZED_IMAGE_HOSTNAMES.includes(hostname)
  } catch {
    return false
  }
}
