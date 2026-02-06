import { and, desc, eq, isNotNull, lte } from "drizzle-orm"
import { Elysia } from "elysia"
import { db, isDbAvailable } from "../db"
import { comics as comicsTable, userReadComics, users } from "../db/schema"
import { getAuthUserFromRequest } from "../utils/auth"

export const comics = new Elysia({ prefix: "/comics" })
  .get("/latest", async ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=3600"
    if (!isDbAvailable) {
      set.status = 404
      return { data: null, message: "HQ não encontrada" }
    }

    const now = new Date()
    const latestComic = await db!
      .select()
      .from(comicsTable)
      .where(and(isNotNull(comicsTable.releaseDate), lte(comicsTable.releaseDate, now)))
      .orderBy(desc(comicsTable.releaseDate))
      .limit(1)

    if (latestComic.length === 0) {
      set.status = 404
      return { data: null, message: "HQ não encontrada" }
    }

    return { data: latestComic[0] }
  })
  .get("/:id", async ({ params: { id }, set }) => {
    if (!isDbAvailable) {
      set.status = 404
      return { data: null, message: "HQ não encontrada" }
    }

    const comic = await db!.select().from(comicsTable).where(eq(comicsTable.id, id)).limit(1)

    if (comic.length === 0) {
      set.status = 404
      return { data: null, message: "HQ não encontrada" }
    }

    return { data: comic[0] }
  })
  .post("/:id/read", async ({ params: { id }, set, request }) => {
    if (!isDbAvailable) {
      set.status = 503
      return { success: false, message: "Banco indisponível" }
    }

    const authUser = getAuthUserFromRequest(request)
    if (!authUser) {
      set.status = 401
      return { success: false, message: "Usuário não autenticado" }
    }

    try {
      const [dbUser] = await db!
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, authUser.email))
        .limit(1)

      if (!dbUser) {
        set.status = 401
        return { success: false, message: "Usuário não autenticado" }
      }

      await db!
        .insert(userReadComics)
        .values({
          userId: dbUser.id,
          comicId: id,
        })
        .onConflictDoNothing()

      return { success: true }
    } catch (error) {
      console.error("Erro ao salvar leitura:", error)
      set.status = 500
      return { success: false, message: "Erro ao salvar leitura" }
    }
  })
