import { Resend } from "resend"

let resend: Resend | null = null
let lastEmailSentAt = 0
const EMAIL_DELAY_MS = 1000
const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL
const SITE_URL = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL

function requireEnv(label: string, value?: string) {
  if (!value) {
    throw new Error(`Env não configurada: ${label}`)
  }
  return value
}

function getApiBaseUrl() {
  return requireEnv("API_BASE_URL", API_BASE_URL).replace(/\/+$/, "")
}

function getSiteUrl() {
  return requireEnv("SITE_URL", SITE_URL).replace(/\/+$/, "")
}

function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) return null
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

async function waitForRateLimit() {
  const now = Date.now()
  const timeSinceLastEmail = now - lastEmailSentAt
  if (timeSinceLastEmail < EMAIL_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, EMAIL_DELAY_MS - timeSinceLastEmail))
  }
  lastEmailSentAt = Date.now()
}

interface NewComicEmailParams {
  to: string
  characterName: string
  comicTitle: string
  subscriberId: string
}

interface NewsletterNewComicEmailParams {
  to: string
  comicTitle: string
  subscriberId: string
}

interface ReportEmailParams {
  message: string
}

export async function sendReportEmail({ message }: ReportEmailParams) {
  const client = getResend()
  if (!client) {
    console.log("[Email] Resend client não configurado, pulando envio de report")
    return null
  }

  await waitForRateLimit()
  console.log("[Email] Enviando report...")

  return client.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "DC Absoluto BR <noreply@dcabsoluto.com.br>",
    to: "leopetrecca@gmail.com",
    subject: "Novo reporte - DC Absoluto BR",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px;">
        <h1 style="color: #e62429; margin-bottom: 8px;">DC Absoluto BR</h1>
        <h2 style="margin-top: 0;">Novo Reporte Recebido</h2>
        <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; border-left: 4px solid #e62429; margin: 16px 0;">
          <p style="white-space: pre-wrap; margin: 0;">${message}</p>
        </div>
        <hr style="border-color: #333; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Reporte enviado através do site DC Absoluto BR.</p>
      </div>
    `,
  })
}

export async function sendNewComicEmail({
  to,
  characterName,
  comicTitle,
  subscriberId,
}: NewComicEmailParams) {
  const client = getResend()
  if (!client) {
    console.log(
      "[Email] Resend client não configurado, pulando envio para subscriber de personagem",
    )
    return null
  }

  await waitForRateLimit()
  console.log(`[Email] Enviando notificação de ${characterName} para ${to}...`)
  const unsubscribeUrl = `${getApiBaseUrl()}/api/newsletter/character/unsubscribe/${subscriberId}`

  return client.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "DC Absoluto BR <noreply@dcabsoluto.com.br>",
    to,
    subject: `Nova HQ de ${characterName}: ${comicTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px;">
        <h1 style="color: #3b82f6; margin-bottom: 8px;">DC Absoluto BR</h1>
        <h2 style="margin-top: 0;">Nova HQ disponível!</h2>
        <p>Uma nova HQ de <strong>${characterName}</strong> foi adicionada ao catálogo:</p>
        <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0;">
          <p style="font-size: 18px; font-weight: bold; margin: 0;">${comicTitle}</p>
        </div>
        <p><a href="${getSiteUrl()}" style="color: #60a5fa; text-decoration: none;">Acesse o site para conferir!</a></p>
        <hr style="border-color: #333; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Você recebeu este e-mail porque se inscreveu para receber novidades de ${characterName}. <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Desinscrever</a></p>
      </div>
    `,
  })
}

export async function sendNewsletterNewComicEmail({
  to,
  comicTitle,
  subscriberId,
}: NewsletterNewComicEmailParams) {
  const client = getResend()
  if (!client) {
    console.log("[Email] Resend client não configurado, pulando envio de newsletter")
    return null
  }

  await waitForRateLimit()
  console.log(`[Email] Enviando newsletter para ${to}...`)
  const unsubscribeUrl = `${getApiBaseUrl()}/api/newsletter/unsubscribe/${subscriberId}`

  return client.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "DC Absoluto BR <noreply@dcabsoluto.com.br>",
    to,
    subject: `Novo lançamento: ${comicTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px;">
        <h1 style="color: #e62429; margin-bottom: 8px;">DC Absoluto BR</h1>
        <h2 style="margin-top: 0;">Novo lançamento no catálogo!</h2>
        <p>Uma nova HQ foi adicionada ao catálogo:</p>
        <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; border-left: 4px solid #e62429; margin: 16px 0;">
          <p style="font-size: 18px; font-weight: bold; margin: 0;">${comicTitle}</p>
        </div>
        <p><a href="${getSiteUrl()}" style="color: #60a5fa; text-decoration: none;">Acesse o site para conferir!</a></p>
        <hr style="border-color: #333; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">Você recebeu este e-mail porque se inscreveu na newsletter do DC Absoluto BR. <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Desinscrever</a></p>
      </div>
    `,
  })
}
