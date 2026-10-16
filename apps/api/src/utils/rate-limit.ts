// Limitador de tentativas em memória (por instância). Suficiente para frear força bruta no login
// e o disparo em massa de e-mails.

interface AttemptWindow {
  count: number
  resetAt: number
}

interface AttemptLimiterOptions {
  maxAttempts: number
  windowMs: number
}

const MAX_TRACKED_KEYS = 10_000

export const TOO_MANY_ATTEMPTS_MESSAGE =
  "Muitas tentativas. Aguarde alguns minutos e tente novamente."

export function createAttemptLimiter({ maxAttempts, windowMs }: AttemptLimiterOptions) {
  const attempts = new Map<string, AttemptWindow>()

  const getActiveWindow = (key: string, now: number) => {
    const window = attempts.get(key)
    if (!window) return null
    if (window.resetAt <= now) {
      attempts.delete(key)
      return null
    }
    return window
  }

  const purgeExpired = (now: number) => {
    for (const [key, window] of attempts) {
      if (window.resetAt <= now) attempts.delete(key)
    }
  }

  const isBlocked = (key: string, now: number = Date.now()) =>
    (getActiveWindow(key, now)?.count ?? 0) >= maxAttempts

  const registerFailure = (key: string, now: number = Date.now()) => {
    const window = getActiveWindow(key, now)
    if (window) {
      window.count += 1
      return
    }

    if (attempts.size >= MAX_TRACKED_KEYS) purgeExpired(now)
    attempts.set(key, { count: 1, resetAt: now + windowMs })
  }

  return {
    isBlocked,
    registerFailure,
    // Conta toda chamada, não só as falhas. Devolve false quando o limite da janela já foi atingido.
    consume(key: string, now: number = Date.now()) {
      if (isBlocked(key, now)) return false
      registerFailure(key, now)
      return true
    },
    reset(key: string) {
      attempts.delete(key)
    },
  }
}
