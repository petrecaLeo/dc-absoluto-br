import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"
import { Elysia } from "elysia"
import { routes } from "./routes"

const isProduction = process.env.NODE_ENV === "production"
const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

// Sem HSTS aqui: o Bun descarta esse header em HTTP puro, e no Render o TLS termina antes da API.
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
}

function toOrigin(value?: string): string | null {
  if (!value) return null
  try {
    return new URL(value.trim()).origin
  } catch {
    return null
  }
}

// Só o próprio site pode chamar a API pelo navegador. Por padrão vale o SITE_URL (com e sem "www.");
// CORS_ORIGINS (separado por vírgula) substitui a lista quando houver outro domínio.
export function getAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = (env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => toOrigin(value))
    .filter((origin): origin is string => origin !== null)
  if (configured.length > 0) return configured

  const origins = new Set<string>()
  const siteOrigin = toOrigin(env.SITE_URL ?? env.NEXT_PUBLIC_SITE_URL)

  if (siteOrigin) {
    origins.add(siteOrigin)
    const siteUrl = new URL(siteOrigin)
    if (siteUrl.hostname.includes(".")) {
      siteUrl.hostname = siteUrl.hostname.startsWith("www.")
        ? siteUrl.hostname.slice("www.".length)
        : `www.${siteUrl.hostname}`
      origins.add(siteUrl.origin)
    }
  }

  if (env.NODE_ENV !== "production") {
    for (const origin of DEV_ORIGINS) origins.add(origin)
  }

  return [...origins]
}

const allowedOrigins = getAllowedOrigins()
if (allowedOrigins.length === 0) {
  console.error("SITE_URL não configurada: o navegador não vai conseguir chamar a API (CORS).")
}

const docs = () =>
  swagger({
    documentation: {
      info: {
        title: "DC Absoluto BR API",
        version: "0.1.0",
        description: "API para o catálogo de HQs do Universo Absolute da DC",
      },
    },
  })

export const createApp = () =>
  new Elysia()
    .headers(SECURITY_HEADERS)
    // Erro inesperado (banco, rede, bug) vira mensagem genérica: detalhes ficam só no log.
    .onError({ as: "global" }, ({ code, error, set }) => {
      if (code !== "UNKNOWN" && code !== "INTERNAL_SERVER_ERROR") return

      console.error("Erro não tratado na API:", error)
      set.status = 500
      return { success: false, message: "Erro interno. Tente novamente mais tarde." }
    })
    // A sessão vai no header Authorization (o cookie do site não chega ao domínio da API), então
    // não há por que liberar credenciais cross-origin.
    .use(cors({ origin: allowedOrigins, credentials: false }))
    // Documentação só fora de produção: em produção ela só ajudaria a mapear a API.
    .use(isProduction ? new Elysia({ name: "docs-disabled" }) : docs())
    .use(routes)
    .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

export type App = ReturnType<typeof createApp>

if (import.meta.main) {
  const app = createApp().listen(process.env.PORT || 3001)
  console.log(`🦊 DC Absoluto API rodando em ${app.server?.hostname}:${app.server?.port}`)
}
