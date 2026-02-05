import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { db, isDbAvailable } from "../db"
import { users } from "../db/schema"

const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
const PASSWORD_PATTERN = "^(?=.*\\d).{6,}$"

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const normalizeName = (name: string) => name.trim().replace(/\\s+/g, " ")

export const auth = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body, set }) => {
      const normalizedEmail = normalizeEmail(body.email)
      const normalizedName = normalizeName(body.name)

      if (normalizedName.length < 2) {
        set.status = 400
        return { success: false, message: "O nome precisa ter pelo menos 2 caracteres." }
      }

      if (!isDbAvailable) {
        return {
          success: true,
          message: "Conta criada (ambiente sem banco)",
          user: {
            id: crypto.randomUUID(),
            name: normalizedName,
            email: normalizedEmail,
          },
        }
      }

      const existing = await db!
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (existing.length > 0) {
        set.status = 409
        return { success: false, message: "E-mail já cadastrado." }
      }

      const passwordHash = await Bun.password.hash(body.password)

      const [createdUser] = await db!
        .insert(users)
        .values({
          name: normalizedName,
          email: normalizedEmail,
          passwordHash,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
        })

      return {
        success: true,
        message: "Conta criada com sucesso.",
        user: createdUser,
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 255 }),
        email: t.String({ format: "email", pattern: EMAIL_PATTERN }),
        password: t.String({ minLength: 6, maxLength: 128, pattern: PASSWORD_PATTERN }),
      }),
    },
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const normalizedEmail = normalizeEmail(body.email)

      if (!isDbAvailable) {
        return {
          success: true,
          message: "Login realizado (ambiente sem banco)",
          user: {
            id: crypto.randomUUID(),
            name: normalizedEmail.split("@")[0] || "Visitante",
            email: normalizedEmail,
          },
        }
      }

      const [user] = await db!
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (!user) {
        set.status = 401
        return { success: false, message: "Credenciais inválidas." }
      }

      const isPasswordValid = await Bun.password.verify(body.password, user.passwordHash)

      if (!isPasswordValid) {
        set.status = 401
        return { success: false, message: "Credenciais inválidas." }
      }

      return {
        success: true,
        message: "Login realizado com sucesso.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", pattern: EMAIL_PATTERN }),
        password: t.String({ minLength: 6, maxLength: 128 }),
      }),
    },
  )
