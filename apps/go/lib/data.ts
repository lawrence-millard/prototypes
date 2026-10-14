import { randomUUID } from "node:crypto"
import { randomCode } from "./code"
import { LIST_LIMIT, WRITE_LIMIT } from "./limits"
import type { Sql } from "./sql"
import { parseId, parseLink } from "./validate"
import { safeHttpUrl } from "./url"

export type Link = { id: string; code: string; url: string; clicks: number; createdAt: string }
export type Fail = "invalid" | "code" | "taken" | "rate" | "unavailable" | "missing" | "limit"
export type Result = { ok: true; id: string } | { ok: false; error: Fail }

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

function nums(row: Record<string, unknown> | undefined) {
  return {
    hits: Number(row?.hits ?? 0),
    n: Number(row?.n ?? 0),
    id: row?.id ? String(row.id) : "",
  }
}

export async function listLinks(sql: Sql, userId: string): Promise<Link[]> {
  const rows = await sql`
    SELECT id, code, url, clicks, created_at
    FROM go_links
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${LIST_LIMIT}
  `
  return rows.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    url: String(row.url),
    clicks: Number(row.clicks ?? 0),
    createdAt: iso(row.created_at),
  }))
}

async function insertLink(sql: Sql, userId: string, code: string, url: string): Promise<Result> {
  const rows = await sql`
    WITH rate AS (
      INSERT INTO go_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN go_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE go_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN go_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE go_rate_limits.window_start
        END
      RETURNING hits
    ),
    room AS (
      SELECT count(*)::int AS n FROM go_links WHERE user_id = ${userId}
    ),
    ins AS (
      INSERT INTO go_links (id, user_id, code, url)
      SELECT ${randomUUID()}, ${userId}, ${code}, ${url}
      WHERE (SELECT hits FROM rate) <= ${WRITE_LIMIT}
        AND (SELECT n FROM room) < ${LIST_LIMIT}
      ON CONFLICT (code) DO NOTHING
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
  if (!row.id) return { ok: false, error: "taken" }
  return { ok: true, id: row.id }
}

export async function createLink(sql: Sql, userId: string, input: { url: unknown; code: unknown }): Promise<Result> {
  const parsed = parseLink(input)
  if (!parsed.ok) return parsed
  const first = await insertLink(sql, userId, parsed.code || randomCode(), parsed.url)
  if (first.ok || parsed.code || first.error !== "taken") return first
  return insertLink(sql, userId, randomCode(), parsed.url)
}

export async function updateLink(sql: Sql, userId: string, input: { id: unknown; url: unknown }): Promise<Result> {
  const id = parseId(input.id)
  const parsed = parseLink({ url: input.url, code: "" })
  if (!id.success) return { ok: false, error: "invalid" }
  if (!parsed.ok) return { ok: false, error: parsed.error === "code" ? "invalid" : parsed.error }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO go_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN go_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE go_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN go_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE go_rate_limits.window_start
        END
      RETURNING hits
    ),
    upd AS (
      UPDATE go_links
      SET url = ${parsed.url}, updated_at = now()
      WHERE id = ${id.data} AND user_id = ${userId}
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

export async function deleteLink(sql: Sql, userId: string, idValue: unknown): Promise<Result> {
  const id = parseId(idValue)
  if (!id.success) return { ok: false, error: "invalid" }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO go_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN go_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE go_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN go_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE go_rate_limits.window_start
        END
      RETURNING hits
    ),
    del AS (
      DELETE FROM go_links
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

export async function hitLink(sql: Sql, code: string) {
  const rows = await sql`
    UPDATE go_links
    SET clicks = clicks + 1
    WHERE code = ${code}
    RETURNING url
  `
  const url = rows[0]?.url
  if (typeof url !== "string") return null
  return safeHttpUrl(url)
}
