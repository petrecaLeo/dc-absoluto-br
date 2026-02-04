import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const databaseUrl = process.env.DATABASE_URL
const isTestEnv = process.env.NODE_ENV === "test"
const shouldUseDatabase = Boolean(databaseUrl) && !isTestEnv

if (!databaseUrl && !isTestEnv) {
  throw new Error("DATABASE_URL não configurada. Defina a variável de ambiente para iniciar a API.")
}

export const isDbAvailable = shouldUseDatabase

const sql = shouldUseDatabase ? neon(databaseUrl!) : null

export const db: NeonHttpDatabase<typeof schema> | null = shouldUseDatabase
  ? drizzle(sql!, { schema })
  : null
