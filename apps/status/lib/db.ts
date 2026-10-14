import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS status_monitors (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    url TEXT NOT NULL CHECK (char_length(url) BETWEEN 1 AND 2000),
    label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, url)
  )`,
  `CREATE INDEX IF NOT EXISTS status_monitors_user_idx ON status_monitors (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS status_checks (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    monitor_id TEXT NOT NULL REFERENCES status_monitors (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    ok BOOLEAN NOT NULL,
    status_code INTEGER,
    latency_ms INTEGER,
    error TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS status_checks_monitor_idx ON status_checks (user_id, monitor_id, checked_at DESC)`,
  `CREATE TABLE IF NOT EXISTS status_rate_limits (
    bucket TEXT PRIMARY KEY CHECK (char_length(bucket) BETWEEN 1 AND 200),
    hits INTEGER NOT NULL,
    window_start TIMESTAMPTZ NOT NULL
  )`,
];

const globalForDb = globalThis as unknown as { statusSql?: Sql; statusReady?: Promise<void> };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) throw new Error("DATABASE_URL is not set");
  return url;
}

export function getSql(): Sql {
  if (!globalForDb.statusSql) globalForDb.statusSql = neon(databaseUrl());
  return globalForDb.statusSql;
}

export async function db(): Promise<Sql> {
  if (!globalForDb.statusReady) {
    globalForDb.statusReady = initSchema().catch((error: unknown) => {
      globalForDb.statusReady = undefined;
      throw error;
    });
  }
  await globalForDb.statusReady;
  return getSql();
}

async function initSchema(): Promise<void> {
  const sql = getSql();
  for (const statement of SCHEMA) await sql.query(statement);
}
