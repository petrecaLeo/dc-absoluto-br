import { and, eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { db, isDbAvailable } from "../db"
import { characterNewsletterSubscribers, characters, newsletterSubscribers } from "../db/schema"

export const newsletter = new Elysia({ prefix: "/newsletter" })
  .post(
    "/subscribe",
    async ({ body }) => {
      if (!isDbAvailable) {
        return { success: true, message: `Email ${body.email} inscrito com sucesso` }
      }

      const existing = await db!
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, body.email))
        .limit(1)

      if (existing.length > 0) {
        if (existing[0].isActive) {
          return { success: true, message: "Você já está inscrito na newsletter" }
        }

        await db!
          .update(newsletterSubscribers)
          .set({ isActive: true })
          .where(eq(newsletterSubscribers.id, existing[0].id))

        return { success: true, message: "Sua inscrição foi reativada com sucesso" }
      }

      await db!.insert(newsletterSubscribers).values({ email: body.email })

      return { success: true, message: `Email ${body.email} inscrito com sucesso` }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    },
  )
  .post(
    "/character/subscribe",
    async ({ body, set }) => {
      if (!isDbAvailable) {
        return { success: true, message: "Inscrição registrada com sucesso" }
      }

      const character = await db!
        .select()
        .from(characters)
        .where(eq(characters.id, body.characterId))
        .limit(1)

      if (character.length === 0) {
        set.status = 404
        return { success: false, message: "Personagem não encontrado" }
      }

      const existing = await db!
        .select()
        .from(characterNewsletterSubscribers)
        .where(
          and(
            eq(characterNewsletterSubscribers.email, body.email),
            eq(characterNewsletterSubscribers.characterId, body.characterId),
          ),
        )
        .limit(1)

      if (existing.length > 0) {
        if (existing[0].isActive) {
          return {
            success: true,
            message: `Você já está inscrito para novidades de ${character[0].name}`,
          }
        }

        await db!
          .update(characterNewsletterSubscribers)
          .set({ isActive: true })
          .where(eq(characterNewsletterSubscribers.id, existing[0].id))

        return {
          success: true,
          message: `Sua inscrição para novidades de ${character[0].name} foi reativada`,
        }
      }

      await db!.insert(characterNewsletterSubscribers).values({
        email: body.email,
        characterId: body.characterId,
      })

      return {
        success: true,
        message: `Inscrito com sucesso para novidades de ${character[0].name}`,
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        characterId: t.String({ format: "uuid" }),
      }),
    },
  )
  .get(
    "/subscription",
    async ({ query }) => {
      if (!isDbAvailable) {
        return { subscribed: false }
      }

      const existing = await db!
        .select({ id: newsletterSubscribers.id })
        .from(newsletterSubscribers)
        .where(
          and(
            eq(newsletterSubscribers.email, query.email),
            eq(newsletterSubscribers.isActive, true),
          ),
        )
        .limit(1)

      return { subscribed: existing.length > 0 }
    },
    {
      query: t.Object({
        email: t.String({ format: "email" }),
      }),
    },
  )
  .get(
    "/character/subscription",
    async ({ query }) => {
      if (!isDbAvailable) {
        return { subscribed: false }
      }

      const existing = await db!
        .select({ id: characterNewsletterSubscribers.id })
        .from(characterNewsletterSubscribers)
        .where(
          and(
            eq(characterNewsletterSubscribers.email, query.email),
            eq(characterNewsletterSubscribers.characterId, query.characterId),
            eq(characterNewsletterSubscribers.isActive, true),
          ),
        )
        .limit(1)

      return { subscribed: existing.length > 0 }
    },
    {
      query: t.Object({
        email: t.String({ format: "email" }),
        characterId: t.String({ format: "uuid" }),
      }),
    },
  )
  .get(
    "/unsubscribe/:id",
    async ({ params: { id }, set }) => {
      if (!isDbAvailable) {
        set.status = 404
        set.headers["Content-Type"] = "text/html; charset=utf-8"
        return renderUnsubscribePage({
          title: "Assinatura não encontrada",
          message: "Não encontramos essa assinatura. Ela pode já ter sido removida.",
        })
      }

      const [subscriber] = await db!
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.id, id))
        .limit(1)

      set.headers["Content-Type"] = "text/html; charset=utf-8"

      if (!subscriber) {
        set.status = 404
        return renderUnsubscribePage({
          title: "Assinatura não encontrada",
          message: "Não encontramos essa assinatura. Ela pode já ter sido removida.",
        })
      }

      if (!subscriber.isActive) {
        return renderUnsubscribePage({
          title: "Você já está desinscrito",
          message: "Sua assinatura já estava cancelada.",
        })
      }

      await db!
        .update(newsletterSubscribers)
        .set({ isActive: false })
        .where(eq(newsletterSubscribers.id, id))

      return renderUnsubscribePage({
        title: "Inscrição cancelada",
        message: "Você foi removido da newsletter do DC Absoluto BR.",
      })
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    },
  )
  .get(
    "/character/unsubscribe/:id",
    async ({ params: { id }, set }) => {
      if (!isDbAvailable) {
        set.status = 404
        set.headers["Content-Type"] = "text/html; charset=utf-8"
        return renderUnsubscribePage({
          title: "Assinatura não encontrada",
          message: "Não encontramos essa assinatura. Ela pode já ter sido removida.",
        })
      }

      const [subscriber] = await db!
        .select()
        .from(characterNewsletterSubscribers)
        .where(eq(characterNewsletterSubscribers.id, id))
        .limit(1)

      set.headers["Content-Type"] = "text/html; charset=utf-8"

      if (!subscriber) {
        set.status = 404
        return renderUnsubscribePage({
          title: "Assinatura não encontrada",
          message: "Não encontramos essa assinatura. Ela pode já ter sido removida.",
        })
      }

      if (!subscriber.isActive) {
        return renderUnsubscribePage({
          title: "Você já está desinscrito",
          message: "Sua assinatura já estava cancelada.",
        })
      }

      await db!
        .update(characterNewsletterSubscribers)
        .set({ isActive: false })
        .where(eq(characterNewsletterSubscribers.id, id))

      return renderUnsubscribePage({
        title: "Inscrição cancelada",
        message: "Você foi removido das notificações desse personagem.",
      })
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    },
  )

function renderUnsubscribePage({ title, message }: { title: string; message: string }) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title} - DC Absoluto BR</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
          .container { max-width: 560px; margin: 48px auto; padding: 32px; background: #111827; border-radius: 12px; }
          h1 { color: #e62429; margin-top: 0; }
          p { color: #d1d5db; }
          a { color: #60a5fa; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
          <p>Se quiser voltar, basta se inscrever novamente no site.</p>
        </div>
      </body>
    </html>
  `
}
