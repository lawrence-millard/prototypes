import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS split_groups (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS split_groups_user_idx ON split_groups (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS split_members (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    group_id TEXT NOT NULL REFERENCES split_groups (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS split_members_group_idx ON split_members (group_id, user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS split_expenses (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    group_id TEXT NOT NULL REFERENCES split_groups (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    payer_id TEXT NOT NULL,
    memo TEXT NOT NULL CHECK (char_length(memo) BETWEEN 1 AND 80),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS split_expenses_group_idx ON split_expenses (group_id, user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS split_shares (
    expense_id TEXT NOT NULL REFERENCES split_expenses (id) ON DELETE CASCADE,
    member_id TEXT NOT NULL,
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    PRIMARY KEY (expense_id, member_id)
  )`,
  `CREATE TABLE IF NOT EXISTS split_rate_limits (
    bucket TEXT PRIMARY KEY CHECK (char_length(bucket) BETWEEN 1 AND 200),
    hits INTEGER NOT NULL,
    window_start TIMESTAMPTZ NOT NULL
  )`,
];

const globalForDb = globalThis as unknown as { splitSql?: Sql; splitReady?: Promise<void> };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) throw new Error("DATABASE_URL is not set");
  return url;
}

export function getSql(): Sql {
  if (!globalForDb.splitSql) globalForDb.splitSql = neon(databaseUrl());
  return globalForDb.splitSql;
}

export async function db(): Promise<Sql> {
  if (!globalForDb.splitReady) {
    globalForDb.splitReady = initSchema().catch((error: unknown) => {
      globalForDb.splitReady = undefined;
      throw error;
    });
  }
  await globalForDb.splitReady;
  return getSql();
}

async function initSchema(): Promise<void> {
  const sql = getSql();
  for (const statement of SCHEMA) await sql.query(statement);
}
