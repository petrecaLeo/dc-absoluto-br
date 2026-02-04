import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"
import { Elysia } from "elysia"
import { routes } from "./routes"

export const createApp = () =>
  new Elysia()
    .use(cors())
    .use(
      swagger({
        documentation: {
          info: {
            title: "DC Absoluto BR API",
            version: "0.1.0",
            description: "API para o catálogo de HQs do Universo Absolute da DC",
          },
        },
      }),
    )
    .use(routes)
    .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

export type App = ReturnType<typeof createApp>

if (import.meta.main) {
  const app = createApp().listen(process.env.PORT || 3001)
  console.log(`🦊 DC Absoluto API rodando em ${app.server?.hostname}:${app.server?.port}`)
}
