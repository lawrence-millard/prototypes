import "server-only"

import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless"
import type { Sql } from "./sql"

neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, cache: "no-store" })

const schema = [
  `CREATE TABLE IF NOT EXISTS habits_habits (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS habits_habits_user_idx ON habits_habits (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS habits_checks (
    habit_id text NOT NULL REFERENCES habits_habits (id) ON DELETE CASCADE,
    user_id text NOT NULL,
    day text NOT NULL,
    PRIMARY KEY (habit_id, day)
  )`,
  `CREATE INDEX IF NOT EXISTS habits_checks_user_idx ON habits_checks (user_id, day)`,
  `CREATE TABLE IF NOT EXISTS habits_rate_limits (
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
