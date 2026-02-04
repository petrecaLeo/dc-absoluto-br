import { and, desc, eq, isNotNull, lte } from "drizzle-orm"
import { Elysia } from "elysia"
import { db, isDbAvailable } from "../db"
import { comics as comicsTable } from "../db/schema"

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
