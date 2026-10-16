import { Elysia, t } from "elysia"
import { sendReportEmail } from "../services/email"
import { TOO_MANY_ATTEMPTS_MESSAGE, createAttemptLimiter } from "../utils/rate-limit"

// Todo reporte vira um e-mail para o dono do site. O teto global impede que um script lote a caixa
// de entrada (e a cota do Resend) sem barrar o uso normal.
const REPORT_LIMITER_KEY = "global"
const reportLimiter = createAttemptLimiter({ maxAttempts: 30, windowMs: 60 * 60 * 1000 })

export const report = new Elysia({ prefix: "/report" }).post(
  "/send",
  async ({ body, set }) => {
    if (!reportLimiter.consume(REPORT_LIMITER_KEY)) {
      set.status = 429
      return { success: false, message: TOO_MANY_ATTEMPTS_MESSAGE }
    }

    const result = await sendReportEmail({ message: body.message })

    if (!result) {
      set.status = 500
      return { success: false, message: "Erro ao enviar reporte. Tente novamente mais tarde." }
    }

    return { success: true, message: "Reporte enviado com sucesso! Obrigado pelo feedback." }
  },
  {
    body: t.Object({
      message: t.String({ minLength: 1, maxLength: 2000 }),
    }),
  },
)
