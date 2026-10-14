import { randomUUID } from "node:crypto"
import { LIST_LIMIT, WRITE_LIMIT } from "./limits"
import type { Sql } from "./sql"
import { expiryFrom, type Expiry } from "./time"
import { parseBody, parseId, parsePaste } from "./validate"

export type Paste = { id: string; body: string; expiresAt: string; createdAt: string }
export type Fail = "invalid" | "taken" | "rate" | "unavailable" | "missing" | "limit"
export type Result = { ok: true; id: string } | { ok: false; error: Fail }

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

function mapPaste(row: Record<string, unknown>): Paste {
  return {
    id: String(row.id),
    body: String(row.body),
    expiresAt: iso(row.expires_at),
    createdAt: iso(row.created_at),
  }
}

function nums(row: Record<string, unknown> | undefined) {
  return {
    hits: Number(row?.hits ?? 0),
    n: Number(row?.n ?? 0),
    id: row?.id ? String(row.id) : "",
  }
}

export async function listPastes(sql: Sql, userId: string): Promise<Paste[]> {
  const rows = await sql`
    SELECT id, body, expires_at, created_at
    FROM paste_pastes
    WHERE user_id = ${userId} AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT ${LIST_LIMIT}
  `
  return rows.map(mapPaste)
}

export async function getPaste(sql: Sql, userId: string, idValue: string): Promise<Paste | null> {
  const id = parseId(idValue)
  if (!id.success) return null
  const rows = await sql`
    SELECT id, body, expires_at, created_at
    FROM paste_pastes
    WHERE id = ${id.data} AND user_id = ${userId} AND expires_at > now()
  `
  const row = rows[0]
  return row ? mapPaste(row) : null
}

export async function createPaste(sql: Sql, userId: string, input: { body: unknown; expiry: unknown }, now = Date.now()): Promise<Result> {
  const parsed = parsePaste(input)
  if (!parsed.ok) return parsed
  const rows = await sql`
    WITH rate AS (
      INSERT INTO paste_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN paste_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE paste_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN paste_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE paste_rate_limits.window_start
        END
      RETURNING hits
    ),
    room AS (
      SELECT count(*)::int AS n FROM paste_pastes WHERE user_id = ${userId} AND expires_at > now()
    ),
    ins AS (
      INSERT INTO paste_pastes (id, user_id, body, expires_at)
      SELECT ${randomUUID()}, ${userId}, ${parsed.body}, ${expiryFrom(parsed.expiry, now)}
      WHERE (SELECT hits FROM rate) <= ${WRITE_LIMIT}
        AND (SELECT n FROM room) < ${LIST_LIMIT}
      RETURNING id
    )
    SELECT
      (SELECT hits FROM rate) AS hits,
      (SELECT n FROM room) AS n,
      (SELECT id FROM ins) AS id
  `
  const row = nums(rows[0])
  if (row.hits > WRITE_LIMIT) return { ok: false, error: "rate" }
  if (!row.id && row.n >= LIST_LIMIT) return { ok: false, error: "limit" }
  if (!row.id) return { ok: false, error: "unavailable" }
  return { ok: true, id: row.id }
}

export async function updatePaste(sql: Sql, userId: string, input: { id: unknown; body: unknown }): Promise<Result> {
  const id = parseId(input.id)
  const body = parseBody(input.body)
  if (!id.success || !body.ok) return { ok: false, error: "invalid" }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO paste_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN paste_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE paste_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN paste_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE paste_rate_limits.window_start
        END
      RETURNING hits
    ),
    upd AS (
      UPDATE paste_pastes
      SET body = ${body.body}, updated_at = now()
      WHERE id = ${id.data} AND user_id = ${userId} AND expires_at > now()
        AND (SELECT hits FROM rate) <= ${WRITE_LIMIT}
      RETURNING id
    )
    SELECT (SELECT hits FROM rate) AS hits, (SELECT id FROM upd) AS id
  `
  const row = nums(rows[0])
  if (row.hits > WRITE_LIMIT) return { ok: false, error: "rate" }
  if (!row.id) return { ok: false, error: "missing" }
  return { ok: true, id: row.id }
}

export async function deletePaste(sql: Sql, userId: string, idValue: unknown): Promise<Result> {
  const id = parseId(idValue)
  if (!id.success) return { ok: false, error: "invalid" }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO paste_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN paste_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE paste_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN paste_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE paste_rate_limits.window_start
        END
      RETURNING hits
    ),
    del AS (
      DELETE FROM paste_pastes
      WHERE id = ${id.data} AND user_id = ${userId}
        AND (SELECT hits FROM rate) <= ${WRITE_LIMIT}
      RETURNING id
    )
    SELECT (SELECT hits FROM rate) AS hits, (SELECT id FROM del) AS id
  `
  const row = nums(rows[0])
  if (row.hits > WRITE_LIMIT) return { ok: false, error: "rate" }
  if (!row.id) return { ok: false, error: "missing" }
  return { ok: true, id: row.id }
}

export type { Expiry }
