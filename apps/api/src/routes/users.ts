import { desc, eq, sql } from "drizzle-orm"
import { Elysia } from "elysia"
import { db, isDbAvailable } from "../db"
import { characters, comicsToCharacters, userReadComics, users } from "../db/schema"

export const usersRoute = new Elysia({ prefix: "/users" }).get(
  "/:id/profile",
  async ({ params: { id }, set }) => {
    set.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=30"

    if (!isDbAvailable) {
      set.status = 503
      return { data: null, message: "Banco indisponível" }
    }

    const [user] = await db!
      .select({
        id: users.id,
        name: users.name,
        profileImage: users.profileImage,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!user) {
      set.status = 404
      return { data: null, message: "Usuário não encontrado" }
    }

    const [readCount] = await db!
      .select({ count: sql<number>`count(*)` })
      .from(userReadComics)
      .where(eq(userReadComics.userId, id))

    const topCharacters = await db!
      .select({
        characterName: characters.name,
        count: sql<number>`count(*)`,
      })
      .from(userReadComics)
      .innerJoin(comicsToCharacters, eq(userReadComics.comicId, comicsToCharacters.comicId))
      .innerJoin(characters, eq(comicsToCharacters.characterId, characters.id))
      .where(eq(userReadComics.userId, id))
      .groupBy(characters.name)
      .orderBy(desc(sql`count(*)`))

    const maxCount = topCharacters.length > 0 ? Number(topCharacters[0]?.count ?? 0) : 0
    const topOnes = topCharacters
      .filter((row) => Number(row.count) === maxCount)
      .map((row) => row.characterName)

    return {
      data: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage ?? null,
        createdAt: user.createdAt.toISOString(),
        readCount: Number(readCount?.count ?? 0),
        topCharacters: topOnes,
      },
    }
  },
)
