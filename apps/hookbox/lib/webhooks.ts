import 'server-only'
import { cache } from 'react'
import { UUID_RE } from './constants'
import { db, type Sql } from './db'
import { cleanName, slugify, withSlugSuffix } from './slug'
import { asInt, asIso } from './time'
import { hashToken, newWebhookToken, tokenMatches } from './token'
import type { WebhookSummary } from './types'

export const listWebhooks = cache(async (): Promise<WebhookSummary[]> => {
  const sql = await db()
  const rows = await sql`
    SELECT w.id, w.name, w.slug, w.created_at, COUNT(m.id)::int AS message_count
    FROM webhooks w
    LEFT JOIN messages m ON m.webhook_id = w.id
    GROUP BY w.id
    ORDER BY w.created_at DESC
  `
  return rows.map(mapWebhook)
})

export async function getWebhook(id: string): Promise<WebhookSummary | null> {
  if (!UUID_RE.test(id)) return null
  const sql = await db()
  const rows = await sql`
    SELECT w.id, w.name, w.slug, w.created_at, COUNT(m.id)::int AS message_count
    FROM webhooks w
    LEFT JOIN messages m ON m.webhook_id = w.id
    WHERE w.id = ${id}::uuid
    GROUP BY w.id
  `
  const row = rows[0]
  return row ? mapWebhook(row) : null
}

export async function insertWebhook(name: string): Promise<{ id: string; token: string }> {
  const cleaned = cleanName(name)
  if (!cleaned) throw new Error('invalid name')
  const sql = await db()
  const token = newWebhookToken()
  const tokenHash = hashToken(token)

  for (let attempt = 1; attempt <= 8; attempt++) {
    const slug = await chooseSlug(sql, cleaned)
    try {
      const rows = await sql`
        INSERT INTO webhooks (name, slug, token_hash)
        VALUES (${cleaned}, ${slug}, ${tokenHash})
        RETURNING id
      `
      return { id: String(rows[0]?.id), token }
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 8) throw error
    }
  }
  throw new Error('slug_exhausted')
}

export async function renameWebhook(id: string, name: string): Promise<void> {
  if (!UUID_RE.test(id)) throw new Error('invalid id')
  const cleaned = cleanName(name)
  if (!cleaned) throw new Error('invalid name')
  const sql = await db()
  const slug = await chooseSlug(sql, cleaned, id)
  const rows = await sql`
    UPDATE webhooks
    SET name = ${cleaned}, slug = ${slug}
    WHERE id = ${id}::uuid
    RETURNING id
  `
  if (rows.length === 0) throw new Error('missing webhook')
}

export async function regenerateWebhookToken(id: string): Promise<string> {
  if (!UUID_RE.test(id)) throw new Error('invalid id')
  const token = newWebhookToken()
  const sql = await db()
  const rows = await sql`
    UPDATE webhooks
    SET token_hash = ${hashToken(token)}
    WHERE id = ${id}::uuid
    RETURNING id
  `
  if (rows.length === 0) throw new Error('missing webhook')
  return token
}

export async function deleteWebhook(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return
  const sql = await db()
  await sql`DELETE FROM webhooks WHERE id = ${id}::uuid`
}

export async function authorizeWebhook(id: string, token: string): Promise<string | null> {
  if (!UUID_RE.test(id) || token.length < 43 || token.length > 256) {
    tokenMatches(token.slice(0, 256), null)
    return null
  }
  const sql = await db()
  const rows = await sql`
    SELECT token_hash
    FROM webhooks
    WHERE id = ${id}::uuid
  `
  const stored = rows.length === 1 && typeof rows[0]?.token_hash === 'string' ? rows[0].token_hash : null
  if (!tokenMatches(token, stored)) return null
  return id
}

async function chooseSlug(sql: Sql, name: string, exceptId?: string): Promise<string> {
  const base = slugify(name)
  for (let n = 1; n <= 40; n++) {
    const slug = withSlugSuffix(base, n)
    const rows = exceptId
      ? await sql`SELECT 1 AS taken FROM webhooks WHERE slug = ${slug} AND id <> ${exceptId}::uuid`
      : await sql`SELECT 1 AS taken FROM webhooks WHERE slug = ${slug}`
    if (rows.length === 0) return slug
  }
  return withSlugSuffix(base, Math.floor(Math.random() * 9000) + 1000)
}

function mapWebhook(row: Record<string, unknown>): WebhookSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    createdAt: asIso(row.created_at),
    messageCount: asInt(row.message_count),
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String(error.code) : ''
  if (code === '23505') return true
  const message = error instanceof Error ? error.message : ''
  return message.includes('23505') || message.includes('duplicate key')
}
