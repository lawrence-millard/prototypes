import "server-only"

import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless"
import type { Sql } from "./sql"

neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, cache: "no-store" })

const schema = [
  `CREATE TABLE IF NOT EXISTS notes_notes (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS notes_notes_user_idx ON notes_notes (user_id, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS notes_rate_limits (
    bucket text PRIMARY KEY,
    hits integer NOT NULL,
    window_start timestamptz NOT NULL
  )`,
]

const globalForDb = globalThis as unknown as {
  client?: NeonQueryFunction<false, false>
  ready?: Promise<void>
}

function raw() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("database")
  if (!globalForDb.client) globalForDb.client = neon(url)
  return globalForDb.client
}

async function migrate() {
  const client = raw()
  for (const statement of schema) await client.query(statement)
}

export async function db(): Promise<Sql> {
  if (!process.env.DATABASE_URL) throw new Error("database")
  if (!globalForDb.ready) {
    globalForDb.ready = migrate().catch((error: unknown) => {
      globalForDb.ready = undefined
      throw error
    })
  }
  await globalForDb.ready
  return raw() as unknown as Sql
}
