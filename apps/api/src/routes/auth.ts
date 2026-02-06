import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { db, isDbAvailable } from "../db"
import { userEmailVerifications, users } from "../db/schema"
import { sendEmailVerificationEmail } from "../services/email"

const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
const PASSWORD_PATTERN = "^(?=.*\\d).{6,}$"
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const normalizeName = (name: string) => name.trim().replace(/\\s+/g, " ")
const createVerificationToken = () => crypto.randomUUID()

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
      const token = createVerificationToken()
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)

      const [pendingRegistration] = await db!
        .select()
        .from(userEmailVerifications)
        .where(eq(userEmailVerifications.email, normalizedEmail))
        .limit(1)

      if (pendingRegistration) {
        await db!
          .update(userEmailVerifications)
          .set({
            name: normalizedName,
            email: normalizedEmail,
            passwordHash,
            token,
            expiresAt,
          })
          .where(eq(userEmailVerifications.id, pendingRegistration.id))
      } else {
        await db!
          .insert(userEmailVerifications)
          .values({
            name: normalizedName,
            email: normalizedEmail,
            passwordHash,
            token,
            expiresAt,
          })
      }

      const emailResult = await sendEmailVerificationEmail({
        to: normalizedEmail,
        name: normalizedName,
        token,
      })

      if (!emailResult) {
        set.status = 500
        return {
          success: false,
          message:
            "Não foi possível enviar o e-mail de confirmação. Tente novamente mais tarde.",
        }
      }

      return {
        success: true,
        message:
          "Enviamos um e-mail de confirmação. O link expira em 24 horas.",
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
        const [pending] = await db!
          .select()
          .from(userEmailVerifications)
          .where(eq(userEmailVerifications.email, normalizedEmail))
          .limit(1)

        if (pending) {
          const isExpired = pending.expiresAt.getTime() < Date.now()

          if (isExpired) {
            await db!
              .delete(userEmailVerifications)
              .where(eq(userEmailVerifications.id, pending.id))

            set.status = 410
            return {
              success: false,
              message:
                "Seu link de confirmação expirou. Faça um novo cadastro.",
            }
          }

          set.status = 403
          return {
            success: false,
            message: "Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada.",
          }
        }

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
  .post(
    "/verify-email",
    async ({ body, set }) => {
      if (!isDbAvailable) {
        return { success: true, message: "Confirmação realizada (ambiente sem banco)." }
      }

      const [pending] = await db!
        .select()
        .from(userEmailVerifications)
        .where(eq(userEmailVerifications.token, body.token))
        .limit(1)

      if (!pending) {
        set.status = 404
        return { success: false, message: "Link inválido ou já utilizado." }
      }

      const isExpired = pending.expiresAt.getTime() < Date.now()
      if (isExpired) {
        await db!
          .delete(userEmailVerifications)
          .where(eq(userEmailVerifications.id, pending.id))

        set.status = 410
        return { success: false, message: "Este link expirou. Faça um novo cadastro." }
      }

      const [existingUser] = await db!
        .select()
        .from(users)
        .where(eq(users.email, pending.email))
        .limit(1)

      if (existingUser) {
        await db!
          .delete(userEmailVerifications)
          .where(eq(userEmailVerifications.id, pending.id))

        return { success: true, message: "E-mail já confirmado. Faça login." }
      }

      await db!.insert(users).values({
        name: pending.name,
        email: pending.email,
        passwordHash: pending.passwordHash,
      })

      await db!
        .delete(userEmailVerifications)
        .where(eq(userEmailVerifications.id, pending.id))

      return { success: true, message: "E-mail confirmado com sucesso." }
    },
    {
      body: t.Object({
        token: t.String({ minLength: 10, maxLength: 255 }),
      }),
    },
  )
  .post(
    "/resend-verification",
    async ({ body, set }) => {
      const normalizedEmail = normalizeEmail(body.email)

      if (!isDbAvailable) {
        return {
          success: true,
          message: "Reenvio solicitado (ambiente sem banco).",
        }
      }

      const [user] = await db!
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (user) {
        return { success: true, message: "E-mail já confirmado. Faça login." }
      }

      const [pending] = await db!
        .select()
        .from(userEmailVerifications)
        .where(eq(userEmailVerifications.email, normalizedEmail))
        .limit(1)

      if (!pending) {
        set.status = 404
        return {
          success: false,
          message: "Nenhum cadastro pendente encontrado para este e-mail.",
        }
      }

      const token = createVerificationToken()
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)

      await db!
        .update(userEmailVerifications)
        .set({ token, expiresAt })
        .where(eq(userEmailVerifications.id, pending.id))

      const emailResult = await sendEmailVerificationEmail({
        to: pending.email,
        name: pending.name,
        token,
      })

      if (!emailResult) {
        set.status = 500
        return {
          success: false,
          message:
            "Não foi possível reenviar o e-mail de confirmação. Tente novamente mais tarde.",
        }
      }

      return {
        success: true,
        message: "Reenviamos o e-mail de confirmação. O link expira em 24 horas.",
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", pattern: EMAIL_PATTERN }),
      }),
    },
  )
