import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS marks_bookmarks (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    url TEXT NOT NULL CHECK (char_length(url) BETWEEN 1 AND 2000),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS marks_bookmarks_user_idx ON marks_bookmarks (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS marks_tags (
    id TEXT PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 24),
    UNIQUE (user_id, name)
  )`,
  `CREATE INDEX IF NOT EXISTS marks_tags_user_idx ON marks_tags (user_id, name)`,
  `CREATE TABLE IF NOT EXISTS marks_bookmark_tags (
    bookmark_id TEXT NOT NULL REFERENCES marks_bookmarks (id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES marks_tags (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
    PRIMARY KEY (bookmark_id, tag_id)
  )`,
  `CREATE INDEX IF NOT EXISTS marks_bookmark_tags_user_idx ON marks_bookmark_tags (user_id, bookmark_id)`,
  `CREATE TABLE IF NOT EXISTS marks_rate_limits (
    bucket TEXT PRIMARY KEY CHECK (char_length(bucket) BETWEEN 1 AND 200),
    hits INTEGER NOT NULL,
    window_start TIMESTAMPTZ NOT NULL
  )`,
];

const globalForDb = globalThis as unknown as { marksSql?: Sql; marksReady?: Promise<void> };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) throw new Error("DATABASE_URL is not set");
  return url;
}

export function getSql(): Sql {
  if (!globalForDb.marksSql) globalForDb.marksSql = neon(databaseUrl());
  return globalForDb.marksSql;
}

export async function db(): Promise<Sql> {
  if (!globalForDb.marksReady) {
    globalForDb.marksReady = initSchema().catch((error: unknown) => {
      globalForDb.marksReady = undefined;
      throw error;
    });
  }
  await globalForDb.marksReady;
  return getSql();
}

async function initSchema(): Promise<void> {
  const sql = getSql();
  for (const statement of SCHEMA) await sql.query(statement);
}
