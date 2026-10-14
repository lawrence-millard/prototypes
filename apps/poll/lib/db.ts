import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS poll_polls (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    question TEXT NOT NULL CHECK (char_length(question) BETWEEN 1 AND 140),
    closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS poll_polls_user_idx ON poll_polls (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS poll_options (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    poll_id TEXT NOT NULL REFERENCES poll_polls (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
    position INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS poll_options_poll_idx ON poll_options (poll_id, position)`,
  `CREATE TABLE IF NOT EXISTS poll_votes (
    poll_id TEXT NOT NULL REFERENCES poll_polls (id) ON DELETE CASCADE,
    option_id TEXT NOT NULL REFERENCES poll_options (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS poll_rate_limits (
    bucket TEXT PRIMARY KEY CHECK (char_length(bucket) BETWEEN 1 AND 200),
    hits INTEGER NOT NULL,
    window_start TIMESTAMPTZ NOT NULL
  )`,
];

const globalForDb = globalThis as unknown as { pollSql?: Sql; pollReady?: Promise<void> };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) throw new Error("DATABASE_URL is not set");
  return url;
}

export function getSql(): Sql {
  if (!globalForDb.pollSql) globalForDb.pollSql = neon(databaseUrl());
  return globalForDb.pollSql;
}

export async function db(): Promise<Sql> {
  if (!globalForDb.pollReady) {
    globalForDb.pollReady = initSchema().catch((error: unknown) => {
      globalForDb.pollReady = undefined;
      throw error;
    });
  }
  await globalForDb.pollReady;
  return getSql();
}

async function initSchema(): Promise<void> {
  const sql = getSql();
  for (const statement of SCHEMA) await sql.query(statement);
}
