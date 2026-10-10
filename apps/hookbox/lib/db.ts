import 'server-only'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { getDatabaseUrl } from './env'

export type Sql = NeonQueryFunction<false, false>

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 48),
    token_hash TEXT NOT NULL CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks (id) ON DELETE CASCADE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sender_ip TEXT,
    content_type TEXT,
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_body TEXT,
    raw_encoding TEXT NOT NULL DEFAULT 'utf8' CHECK (raw_encoding IN ('utf8', 'base64')),
    content TEXT,
    username TEXT,
    avatar_url TEXT,
    embeds JSONB,
    payload JSONB,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb
  )`,
  `CREATE INDEX IF NOT EXISTS messages_webhook_received_idx
    ON messages (webhook_id, received_at DESC)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    bucket TEXT PRIMARY KEY,
    hits INTEGER NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    locked_until TIMESTAMPTZ
  )`,
]

let sql: Sql | null = null
let schemaReady: Promise<void> | null = null

export function getSql(): Sql {
  if (!sql) sql = neon(getDatabaseUrl())
  return sql
}

export async function db(): Promise<Sql> {
  await ensureSchema()
  return getSql()
}

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initSchema().catch((error: unknown) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}

async function initSchema(): Promise<void> {
  const query = getSql()
  for (const statement of SCHEMA) {
    await query.query(statement)
  }
}
