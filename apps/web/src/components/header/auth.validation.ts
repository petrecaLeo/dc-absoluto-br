import type { AuthUser } from "./auth.types"

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

export function parseAuthUser(input: unknown): AuthUser | null {
  if (!input || typeof input !== "object") return null

  const { id, name, email } = input as Record<string, unknown>

  if (!isNonEmptyString(id) || !isNonEmptyString(name) || !isNonEmptyString(email)) {
    return null
  }

  return { id, name, email }
}
