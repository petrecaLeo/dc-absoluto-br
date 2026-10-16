import { ADMIN_SESSION_TTL_SECONDS } from "@dc-absoluto/shared-types/session-token"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { db, isDbAvailable } from "../db"
import { users } from "../db/schema"
import { createAdminSessionToken, getAdminEmail } from "../utils/auth"
import { TOO_MANY_ATTEMPTS_MESSAGE, createAttemptLimiter } from "../utils/rate-limit"

const INVALID_CREDENTIALS_MESSAGE = "Credenciais inválidas."
const adminLoginLimiter = createAttemptLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 })

// Hash fictício para que e-mail errado e senha errada levem o mesmo tempo para responder.
let dummyPasswordHash: Promise<string> | null = null
const getDummyPasswordHash = () => {
  dummyPasswordHash ??= Bun.password.hash(crypto.randomUUID())
  return dummyPasswordHash
}

export const admin = new Elysia({ prefix: "/admin" }).post(
  "/login",
  async ({ body, set }) => {
    const adminEmail = getAdminEmail()
    if (!adminEmail) {
      console.error("ADMIN_EMAIL não configurado: login administrativo desativado.")
      set.status = 503
      return { success: false, message: "Área administrativa indisponível." }
    }

    if (!isDbAvailable) {
      set.status = 503
      return { success: false, message: "Banco indisponível" }
    }

    const email = body.email.trim().toLowerCase()
    if (adminLoginLimiter.isBlocked(email)) {
      set.status = 429
      return { success: false, message: TOO_MANY_ATTEMPTS_MESSAGE }
    }

    const [user] =
      email === adminEmail
        ? await db!.select().from(users).where(eq(users.email, email)).limit(1)
        : []

    const isPasswordValid = await Bun.password.verify(
      body.password,
      user?.passwordHash ?? (await getDummyPasswordHash()),
    )

    if (!user || !isPasswordValid) {
      adminLoginLimiter.registerFailure(email)
      set.status = 401
      return { success: false, message: INVALID_CREDENTIALS_MESSAGE }
    }

    adminLoginLimiter.reset(email)

    return {
      success: true,
      token: await createAdminSessionToken(user),
      expiresIn: ADMIN_SESSION_TTL_SECONDS,
    }
  },
  {
    body: t.Object({
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ minLength: 1, maxLength: 128 }),
    }),
  },
)
