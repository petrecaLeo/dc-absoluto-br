"use client"

import { useCallback, useState } from "react"
import { PUBLIC_API_URL } from "@/lib/env/public"
import type { AuthUser } from "./auth.types"

const API_URL = PUBLIC_API_URL

export type AuthMode = "signup" | "login"

const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
const PASSWORD_PATTERN = "^(?=.*\\d).{6,}$"

const emailRegex = new RegExp(EMAIL_PATTERN)
const passwordRegex = new RegExp(PASSWORD_PATTERN)

export function useLoginModal() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const validate = useCallback(() => {
    if (mode === "signup" && name.trim().length < 2) {
      return "O nome precisa ter pelo menos 2 caracteres."
    }

    if (!emailRegex.test(email.trim())) {
      return "Digite um e-mail válido."
    }

    if (!passwordRegex.test(password)) {
      return "A senha precisa ter no mínimo 6 caracteres e 1 número."
    }

    return null
  }, [email, mode, name, password])

  const submit = useCallback(async (): Promise<AuthUser | null> => {
    const error = validate()

    if (error) {
      setStatus("error")
      setMessage(error)
      return null
    }

    setStatus("loading")
    setMessage("")

    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login"
      const normalizedEmail = email.trim().toLowerCase()
      const payload =
        mode === "signup"
          ? { name: name.trim(), email: normalizedEmail, password }
          : { email: normalizedEmail, password }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.user) {
          setStatus("success")
          setMessage(data.message ?? "Login realizado.")
          return data.user as AuthUser
        }

        setStatus("success")
        setMessage(
          data.message ??
            (mode === "signup"
              ? "Enviamos um e-mail de confirmação. Confira sua caixa de entrada."
              : "Ação concluída."),
        )
        if (mode === "signup") {
          setPassword("")
        }
        return null
      }

      setStatus("error")
      setMessage(data.message ?? "Não foi possível completar a ação.")
      return null
    } catch {
      setStatus("error")
      setMessage("Erro de conexão. Tente novamente.")
      return null
    }
  }, [API_URL, email, mode, name, password, validate])

  const resendVerification = useCallback(async () => {
    if (!emailRegex.test(email.trim())) {
      setStatus("error")
      setMessage("Digite um e-mail válido para reenviar a confirmação.")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setStatus("success")
        setMessage(
          data.message ?? "Reenviamos o e-mail de confirmação. Confira sua caixa de entrada.",
        )
        return
      }

      setStatus("error")
      setMessage(data.message ?? "Não foi possível reenviar a confirmação.")
    } catch {
      setStatus("error")
      setMessage("Erro de conexão. Tente novamente.")
    }
  }, [API_URL, email])

  const reset = useCallback(() => {
    setMode("login")
    setName("")
    setEmail("")
    setPassword("")
    setStatus("idle")
    setMessage("")
  }, [])

  const switchMode = useCallback((nextMode: AuthMode) => {
    setMode(nextMode)
    setName("")
    setEmail("")
    setPassword("")
    setStatus("idle")
    setMessage("")
  }, [])

  return {
    mode,
    setMode: switchMode,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    status,
    message,
    submit,
    resendVerification,
    reset,
    emailPattern: EMAIL_PATTERN,
    passwordPattern: PASSWORD_PATTERN,
  }
}
