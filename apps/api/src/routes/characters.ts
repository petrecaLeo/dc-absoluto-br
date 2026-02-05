import { asc, eq } from "drizzle-orm"
import { Elysia } from "elysia"
import { db, isDbAvailable } from "../db"
import { characters as charactersTable, comics, comicsToCharacters } from "../db/schema"

export const characters = new Elysia({ prefix: "/characters" })
  .get("/", async ({ set }) => {
    set.headers["Cache-Control"] = "public, max-age=604800, stale-while-revalidate=86400"
    if (!isDbAvailable) {
      return { data: [], total: 0 }
    }

    const allCharacters = await db!.select().from(charactersTable)
    return { data: allCharacters, total: allCharacters.length }
  })
  .get("/:slug/comics", async ({ params: { slug }, set }) => {
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
      .where(eq(comicsToCharacters.characterId, character[0].id))
      .orderBy(asc(comics.releaseDate))

    set.headers["Cache-Control"] = "public, max-age=180, stale-while-revalidate=60"

    return {
      data: characterComics,
      character: character[0],
      total: characterComics.length,
    }
  })
