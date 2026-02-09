import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { db, isDbAvailable } from "../db"
import { characters, comics as comicsTable, comicsToCharacters, userReadComics, users } from "../db/schema"
import { getAuthUserFromRequest } from "../utils/auth"

const normalizeText = (value?: string | null) => value?.trim() || undefined

const parseReleaseDate = (value?: string | null) => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const usMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (usMatch) {
    const month = Number(usMatch[1])
    const day = Number(usMatch[2])
    const year = Number(usMatch[3])

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null
    }

    const isoDate = `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    const parsed = new Date(isoDate)

    if (Number.isNaN(parsed.getTime())) {
      return null
    }

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null
    }

    return parsed
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

export const comics = new Elysia({ prefix: "/comics" })
  .post(
    "/",
    async ({ body, set }) => {
      if (!isDbAvailable) {
        set.status = 503
        return { success: false, message: "Banco indisponível" }
      }

      const releaseDate = parseReleaseDate(body.releaseDate)
      if (body.releaseDate && !releaseDate) {
        set.status = 400
        return {
          success: false,
          message: "Data de lançamento inválida. Use MM/DD/YYYY ou ISO 8601.",
        }
      }

      if (body.characterId) {
        const character = await db!
          .select({ id: characters.id })
          .from(characters)
          .where(eq(characters.id, body.characterId))
          .limit(1)

        if (character.length === 0) {
          set.status = 404
          return { success: false, message: "Personagem não encontrado" }
        }
      }

      const normalizedTitle = normalizeText(body.title)
      if (!normalizedTitle) {
        set.status = 400
        return { success: false, message: "Título inválido" }
      }

      try {
        const [createdComic] = await db!
          .insert(comicsTable)
          .values({
            title: normalizedTitle,
            publisher: normalizeText(body.publisher) ?? "DC Comics",
            issueNumber: body.issueNumber ?? null,
            releaseDate: releaseDate ?? null,
            downloadUrl: normalizeText(body.downloadUrl) ?? null,
            coverUrl: normalizeText(body.coverUrl) ?? null,
            writer: normalizeText(body.writer ?? body.writter) ?? null,
            artists: normalizeText(body.artists ?? body.artisti) ?? null,
          })
          .returning()

        if (body.characterId) {
          await db!
            .insert(comicsToCharacters)
            .values({ comicId: createdComic.id, characterId: body.characterId })
            .onConflictDoNothing()
        }

        set.status = 201
        return { data: createdComic }
      } catch (error) {
        const errorCode =
          typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null

        if (errorCode === "23505") {
          set.status = 409
          return { success: false, message: "HQ já cadastrada" }
        }

        console.error("Erro ao cadastrar HQ:", error)
        set.status = 500
        return { success: false, message: "Erro ao cadastrar HQ" }
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
        publisher: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        issueNumber: t.Optional(t.Number({ minimum: 0 })),
        releaseDate: t.Optional(t.String({ minLength: 4, maxLength: 32 })),
        downloadUrl: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
        coverUrl: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
        writer: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        artists: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
        writter: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        artisti: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
        characterId: t.Optional(t.String({ format: "uuid" })),
      }),
    },
  )
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
  .get("/read/count", async ({ set, request }) => {
    set.headers["Cache-Control"] = "private, max-age=0, no-store"

    if (!isDbAvailable) {
      set.status = 503
      return { data: { count: 0 }, message: "Banco indisponível" }
    }

    const authUser = getAuthUserFromRequest(request)
    if (!authUser) {
      set.status = 401
      return { data: { count: 0 }, message: "Usuário não autenticado" }
    }

    const [dbUser] = await db!
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, authUser.email))
      .limit(1)

    if (!dbUser) {
      set.status = 401
      return { data: { count: 0 }, message: "Usuário não autenticado" }
    }

    const [result] = await db!
      .select({ count: sql<number>`count(*)` })
      .from(userReadComics)
      .where(eq(userReadComics.userId, dbUser.id))

    return { data: { count: Number(result?.count ?? 0) } }
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
