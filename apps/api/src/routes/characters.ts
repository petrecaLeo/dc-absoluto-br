import { and, asc, eq, sql } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { DEFAULT_COMIC_UNIVERSE, getComicUniverseLabel } from "@dc-absoluto/shared-types"
import { db, isDbAvailable } from "../db"
import {
  characters as charactersTable,
  comics,
  comicsToCharacters,
  userReadComics,
  users,
} from "../db/schema"
import { getAuthUserFromRequest } from "../utils/auth"

const UNIVERSE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const normalizeUniverse = (value?: string | null) => {
  const trimmed = value?.trim().toLowerCase()
  if (!trimmed) return undefined
  return trimmed.replace(/\s+/g, "-")
}

export const characters = new Elysia({ prefix: "/characters" })
  .get("/", async ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=604800, stale-while-revalidate=86400"
    if (!isDbAvailable) {
      return { data: [], total: 0 }
    }

    const allCharacters = await db!.select().from(charactersTable)
    return { data: allCharacters, total: allCharacters.length }
  })
  .get("/:slug/comics/read", async ({ params: { slug }, set, request }) => {
    set.headers["Cache-Control"] = "private, max-age=0, no-store"

    if (!isDbAvailable) {
      set.status = 503
      return { data: [], message: "Banco indisponível" }
    }

    const authUser = await getAuthUserFromRequest(request)
    if (!authUser) {
      set.status = 401
      return { data: [], message: "Usuário não autenticado" }
    }

    const [dbUser] = await db!
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, authUser.email))
      .limit(1)

    if (!dbUser) {
      set.status = 401
      return { data: [], message: "Usuário não autenticado" }
    }

    const character = await db!
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.slug, slug))
      .limit(1)

    if (character.length === 0) {
      set.status = 404
      return { data: [], message: "Personagem não encontrado" }
    }

    const readComics = await db!
      .select({
        comicId: userReadComics.comicId,
        readAt: userReadComics.readAt,
      })
      .from(userReadComics)
      .innerJoin(comicsToCharacters, eq(userReadComics.comicId, comicsToCharacters.comicId))
      .where(
        and(
          eq(userReadComics.userId, dbUser.id),
          eq(comicsToCharacters.characterId, character[0].id),
        ),
      )

    return { data: readComics.map((row) => ({ comicId: row.comicId, readAt: row.readAt })) }
  })
  .get("/:slug/universes", async ({ params: { slug }, set }) => {
    if (!isDbAvailable) {
      set.status = 404
      return { data: null, message: "Personagem não encontrado" }
    }

    const character = await db!
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.slug, slug))
      .limit(1)

    if (character.length === 0) {
      set.status = 404
      return { data: null, message: "Personagem não encontrado" }
    }

    const characterComics = await db!
      .selectDistinct({
        id: comics.id,
        title: comics.title,
        universe: comics.universe,
        coverUrl: comics.coverUrl,
        releaseDate: comics.releaseDate,
      })
      .from(comicsToCharacters)
      .innerJoin(comics, eq(comicsToCharacters.comicId, comics.id))
      .where(eq(comicsToCharacters.characterId, character[0].id))
      // HQ sem data não pode virar a "mais recente" do universo (DESC põe NULL primeiro no Postgres).
      .orderBy(sql`${comics.releaseDate} desc nulls last`, asc(comics.title))

    const groupedByUniverse = new Map<
      string,
      {
        universe: string
        label: string
        total: number
        latestComic: {
          id: string
          title: string
          coverUrl: string | null
          releaseDate: Date | null
        } | null
      }
    >()

    for (const comic of characterComics) {
      const universe = comic.universe || DEFAULT_COMIC_UNIVERSE
      const existing = groupedByUniverse.get(universe)

      if (!existing) {
        groupedByUniverse.set(universe, {
          universe,
          label: getComicUniverseLabel(universe),
          total: 1,
          latestComic: {
            id: comic.id,
            title: comic.title,
            coverUrl: comic.coverUrl ?? null,
            releaseDate: comic.releaseDate ?? null,
          },
        })
        continue
      }

      existing.total += 1
    }

    const universes = [...groupedByUniverse.values()].sort((a, b) =>
      a.label.localeCompare(b.label, "en"),
    )

    set.headers["Cache-Control"] = "public, max-age=180, stale-while-revalidate=60"

    return {
      data: universes,
      character: character[0],
      total: universes.length,
    }
  })
  .get(
    "/:slug/comics",
    async ({ params: { slug }, query, set }) => {
      if (!isDbAvailable) {
        set.status = 404
        return { data: null, message: "Personagem não encontrado" }
      }

      const universe = normalizeUniverse(query.universe)
      if (query.universe && (!universe || !UNIVERSE_SLUG_PATTERN.test(universe))) {
        set.status = 400
        return { data: null, message: "Universo inválido" }
      }

      const character = await db!
        .select()
        .from(charactersTable)
        .where(eq(charactersTable.slug, slug))
        .limit(1)

      if (character.length === 0) {
        set.status = 404
        return { data: null, message: "Personagem não encontrado" }
      }

      const conditions = [eq(comicsToCharacters.characterId, character[0].id)]
      if (universe) {
        conditions.push(eq(comics.universe, universe))
      }

      const characterComics = await db!
        .selectDistinct({
          id: comics.id,
          title: comics.title,
          universe: comics.universe,
          issueNumber: comics.issueNumber,
          coverUrl: comics.coverUrl,
          downloadUrl: comics.downloadUrl,
          releaseDate: comics.releaseDate,
          publisher: comics.publisher,
          writer: comics.writer,
          artists: comics.artists,
          createdAt: comics.createdAt,
          updatedAt: comics.updatedAt,
        })
        .from(comicsToCharacters)
        .innerJoin(comics, eq(comicsToCharacters.comicId, comics.id))
        .where(and(...conditions))
        .orderBy(asc(comics.releaseDate))

      set.headers["Cache-Control"] = "public, max-age=180, stale-while-revalidate=60"

      return {
        data: characterComics,
        character: character[0],
        universe: universe
          ? {
              slug: universe,
              label: getComicUniverseLabel(universe),
            }
          : null,
        total: characterComics.length,
      }
    },
    {
      query: t.Object({
        universe: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      }),
    },
  )
