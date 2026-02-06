"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PUBLIC_API_URL } from "@/lib/env/public"

type VerificationStatus = "loading" | "success" | "expired" | "invalid" | "error" | "missing"

const REDIRECT_DELAY_SECONDS = 5

export default function ConfirmarEmailClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<VerificationStatus>("loading")
  const [message, setMessage] = useState("Confirmando seu e-mail...")
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_SECONDS)

  useEffect(() => {
    if (!token) {
      setStatus("missing")
      setMessage("Link de confirmação inválido. Faça um novo cadastro.")
      return
    }

    let isActive = true

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const data = await response.json().catch(() => ({}))
        if (!isActive) return

        if (response.ok) {
          setStatus("success")
          setMessage(data.message ?? "E-mail confirmado com sucesso.")
          return
        }

        if (response.status === 410) {
          setStatus("expired")
          setMessage(data.message ?? "Este link expirou. Faça um novo cadastro.")
          return
        }

        if (response.status === 404) {
          setStatus("invalid")
          setMessage(data.message ?? "Link inválido ou já utilizado.")
          return
        }

        setStatus("error")
        setMessage(data.message ?? "Não foi possível confirmar o e-mail.")
      } catch {
        if (!isActive) return
        setStatus("error")
        setMessage("Não foi possível confirmar o e-mail. Tente novamente.")
      }
    }

    verifyEmail()

    return () => {
      isActive = false
    }
  }, [token])

  useEffect(() => {
    if (status !== "success") return

    setSecondsLeft(REDIRECT_DELAY_SECONDS)

    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)

    const timeout = setTimeout(() => {
      router.push("/")
    }, REDIRECT_DELAY_SECONDS * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router, status])

  return (
    <div className="min-h-svh bg-dc-black text-white">
      <main className="flex min-h-svh items-center justify-center px-6 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(30,64,175,0.15)] backdrop-blur">
          <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            <span className="h-px w-10 bg-gradient-to-r from-blue-500 via-blue-400 to-transparent" />
            Confirmação
          </div>

          <h1 className="text-2xl font-black uppercase tracking-wide">E-mail</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{message}</p>

          {status === "success" && (
            <p className="mt-4 text-sm text-emerald-300">
              Redirecionando para a página inicial em {secondsLeft}s.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white transition hover:bg-white/20"
            >
              Ir para a home
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
