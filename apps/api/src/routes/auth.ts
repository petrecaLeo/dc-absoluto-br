import { PROFILE_IMAGE_OPTIONS } from "@dc-absoluto/shared-types"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { db, isDbAvailable } from "../db"
import { passwordResetTokens, userEmailVerifications, users } from "../db/schema"
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "../services/email"
import { getAuthUserFromRequest } from "../utils/auth"

const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
const PASSWORD_PATTERN = "^(?=.*\\d).{6,}$"
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000
const PROFILE_IMAGE_IDS = new Set(PROFILE_IMAGE_OPTIONS.map((option) => option.id))

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
            profileImage: null,
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
        await db!.insert(userEmailVerifications).values({
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
          message: "Não foi possível enviar o e-mail de confirmação. Tente novamente mais tarde.",
        }
      }

      return {
        success: true,
        message: "Enviamos um e-mail de confirmação. O link expira em 24 horas.",
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
            profileImage: null,
          },
        }
      }

      const [user] = await db!.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)

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
              message: "Seu link de confirmação expirou. Faça um novo cadastro.",
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
          profileImage: user.profileImage ?? null,
          createdAt: user.createdAt.toISOString(),
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
    "/change-password",
    async ({ body, request, set }) => {
      const authUser = getAuthUserFromRequest(request)
      if (!authUser) {
        set.status = 401
        return { success: false, message: "Usuário não autenticado." }
      }

      if (!isDbAvailable) {
        return { success: true, message: "Senha alterada (ambiente sem banco)." }
      }

      try {
        const [user] = await db!
          .select()
          .from(users)
          .where(eq(users.email, authUser.email))
          .limit(1)

        if (!user) {
          set.status = 401
          return { success: false, message: "Usuário não autenticado." }
        }

        const isPasswordValid = await Bun.password.verify(body.currentPassword, user.passwordHash)

        if (!isPasswordValid) {
          set.status = 401
          return { success: false, message: "Senha atual inválida." }
        }

        if (body.currentPassword === body.newPassword) {
          set.status = 400
          return {
            success: false,
            message: "A nova senha precisa ser diferente da senha atual.",
          }
        }

        const passwordHash = await Bun.password.hash(body.newPassword)

        await db!
          .update(users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(users.id, user.id))

        return { success: true, message: "Senha alterada com sucesso." }
      } catch (error) {
        console.error("Erro ao alterar senha:", error)
        set.status = 500
        return { success: false, message: "Erro ao alterar senha." }
      }
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 6, maxLength: 128 }),
        newPassword: t.String({ minLength: 6, maxLength: 128, pattern: PASSWORD_PATTERN }),
      }),
    },
  )
  .post(
    "/profile-image",
    async ({ body, request, set }) => {
      const authUser = getAuthUserFromRequest(request)
      if (!authUser) {
        set.status = 401
        return { success: false, message: "Usuário não autenticado." }
      }

      const profileImage = body.profileImage.trim()
      if (!PROFILE_IMAGE_IDS.has(profileImage)) {
        set.status = 400
        return { success: false, message: "Foto de perfil inválida." }
      }

      if (!isDbAvailable) {
        return {
          success: true,
          message: "Foto atualizada (ambiente sem banco).",
          user: {
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            profileImage,
          },
        }
      }

      try {
        const [user] = await db!
          .select()
          .from(users)
          .where(eq(users.email, authUser.email))
          .limit(1)

        if (!user) {
          set.status = 401
          return { success: false, message: "Usuário não autenticado." }
        }

        await db!
          .update(users)
          .set({ profileImage, updatedAt: new Date() })
          .where(eq(users.id, user.id))

        return {
          success: true,
          message: "Foto atualizada com sucesso.",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profileImage,
            createdAt: user.createdAt.toISOString(),
          },
        }
      } catch (error) {
        console.error("Erro ao atualizar foto de perfil:", error)
        set.status = 500
        return { success: false, message: "Erro ao atualizar foto de perfil." }
      }
    },
    {
      body: t.Object({
        profileImage: t.String({ minLength: 1, maxLength: 100 }),
      }),
    },
  )
  .post(
    "/profile-name",
    async ({ body, request, set }) => {
      const authUser = getAuthUserFromRequest(request)
      if (!authUser) {
        set.status = 401
        return { success: false, message: "Usuário não autenticado." }
      }

      const name = normalizeName(body.name)
      if (name.length < 2) {
        set.status = 400
        return { success: false, message: "O nome precisa ter pelo menos 2 caracteres." }
      }

      if (!isDbAvailable) {
        return {
          success: true,
          message: "Nome atualizado (ambiente sem banco).",
          user: {
            id: authUser.id,
            name,
            email: authUser.email,
            profileImage: authUser.profileImage,
          },
        }
      }

      try {
        const [user] = await db!
          .select()
          .from(users)
          .where(eq(users.email, authUser.email))
          .limit(1)

        if (!user) {
          set.status = 401
          return { success: false, message: "Usuário não autenticado." }
        }

        await db!.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id))

        return {
          success: true,
          message: "Nome atualizado com sucesso.",
          user: {
            id: user.id,
            name,
            email: user.email,
            profileImage: user.profileImage,
            createdAt: user.createdAt.toISOString(),
          },
        }
      } catch (error) {
        console.error("Erro ao atualizar nome:", error)
        set.status = 500
        return { success: false, message: "Erro ao atualizar nome." }
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 255 }),
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
        await db!.delete(userEmailVerifications).where(eq(userEmailVerifications.id, pending.id))

        set.status = 410
        return { success: false, message: "Este link expirou. Faça um novo cadastro." }
      }

      const [existingUser] = await db!
        .select()
        .from(users)
        .where(eq(users.email, pending.email))
        .limit(1)

      if (existingUser) {
        await db!.delete(userEmailVerifications).where(eq(userEmailVerifications.id, pending.id))

        return { success: true, message: "E-mail já confirmado. Faça login." }
      }

      await db!.insert(users).values({
        name: pending.name,
        email: pending.email,
        passwordHash: pending.passwordHash,
      })

      await db!.delete(userEmailVerifications).where(eq(userEmailVerifications.id, pending.id))

      return { success: true, message: "E-mail confirmado com sucesso." }
    },
    {
      body: t.Object({
        token: t.String({ minLength: 10, maxLength: 255 }),
      }),
    },
  )
  .post(
    "/request-password-reset",
    async ({ body }) => {
      const normalizedEmail = normalizeEmail(body.email)
      const successMessage =
        "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha."

      if (!isDbAvailable) {
        return { success: true, message: successMessage }
      }

      const [user] = await db!.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)

      if (!user) {
        return { success: true, message: successMessage }
      }

      const token = createVerificationToken()
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS)

      await db!.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

      await db!.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      })

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token,
      })

      return { success: true, message: successMessage }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", pattern: EMAIL_PATTERN }),
      }),
    },
  )
  .post(
    "/reset-password",
    async ({ body, set }) => {
      if (!isDbAvailable) {
        return { success: true, message: "Senha redefinida (ambiente sem banco)." }
      }

      const [resetToken] = await db!
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, body.token))
        .limit(1)

      if (!resetToken) {
        set.status = 404
        return { success: false, message: "Link inválido ou já utilizado." }
      }

      if (resetToken.expiresAt.getTime() < Date.now()) {
        await db!.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id))

        set.status = 410
        return { success: false, message: "Este link expirou. Solicite um novo link." }
      }

      const passwordHash = await Bun.password.hash(body.password)

      await db!
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetToken.userId))

      await db!.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id))

      return { success: true, message: "Senha redefinida com sucesso." }
    },
    {
      body: t.Object({
        token: t.String({ minLength: 10, maxLength: 255 }),
        password: t.String({ minLength: 6, maxLength: 128, pattern: PASSWORD_PATTERN }),
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

      const [user] = await db!.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)

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
          message: "Não foi possível reenviar o e-mail de confirmação. Tente novamente mais tarde.",
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
