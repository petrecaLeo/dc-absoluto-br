import { createHash } from "node:crypto"
import { type Column, eq, or } from "drizzle-orm"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Tokens dos links de e-mail (confirmação de cadastro e redefinição de senha). O banco guarda só o
// hash SHA-256: quem conseguir ler o banco não consegue usar os links que ainda estão valendo.
export const createEmailToken = () => crypto.randomUUID()

export const hashEmailToken = (token: string) => createHash("sha256").update(token).digest("hex")

// Links enviados antes do hash guardaram o UUID cru e continuam valendo até expirarem (24h no
// máximo). Só um UUID entra nessa comparação: mandar o próprio hash lido do banco (64 caracteres
// hexadecimais) como token nunca casa com nada.
export function matchesEmailToken(column: Column, token: string) {
  const hashed = eq(column, hashEmailToken(token))
  return UUID_PATTERN.test(token) ? or(hashed, eq(column, token)) : hashed
}
