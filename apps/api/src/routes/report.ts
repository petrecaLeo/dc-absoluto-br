import { Elysia, t } from "elysia"
import { sendReportEmail } from "../services/email"

export const report = new Elysia({ prefix: "/report" }).post(
  "/send",
  async ({ body, set }) => {
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
