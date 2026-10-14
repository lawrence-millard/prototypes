import { randomUUID } from "node:crypto"
import { LIST_LIMIT, WRITE_LIMIT } from "./limits"
import type { Sql } from "./sql"
import { parseId, parseNote } from "./validate"

export type Note = { id: string; title: string; updatedAt: string }
export type NoteDetail = Note & { body: string }
export type Fail = "invalid" | "rate" | "unavailable" | "missing" | "limit"
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

export async function listNotes(sql: Sql, userId: string): Promise<Note[]> {
  const rows = await sql`
    SELECT id, title, updated_at
    FROM notes_notes
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT ${LIST_LIMIT}
  `
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    updatedAt: iso(row.updated_at),
  }))
}

export async function getNote(sql: Sql, userId: string, idValue: string): Promise<NoteDetail | null> {
  const id = parseId(idValue)
  if (!id.success) return null
  const rows = await sql`
    SELECT id, title, body, updated_at
    FROM notes_notes
    WHERE id = ${id.data} AND user_id = ${userId}
  `
  const row = rows[0]
  if (!row) return null
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ""),
    updatedAt: iso(row.updated_at),
  }
}

export async function createNote(sql: Sql, userId: string, input: { title: unknown; body: unknown }): Promise<Result> {
  const parsed = parseNote(input)
  if (!parsed.ok) return parsed
  const rows = await sql`
    WITH rate AS (
      INSERT INTO notes_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN notes_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE notes_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN notes_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE notes_rate_limits.window_start
        END
      RETURNING hits
    ),
    room AS (
      SELECT count(*)::int AS n FROM notes_notes WHERE user_id = ${userId}
    ),
    ins AS (
      INSERT INTO notes_notes (id, user_id, title, body)
      SELECT ${randomUUID()}, ${userId}, ${parsed.title}, ${parsed.body}
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

export async function updateNote(sql: Sql, userId: string, input: { id: unknown; title: unknown; body: unknown }): Promise<Result> {
  const id = parseId(input.id)
  const parsed = parseNote(input)
  if (!id.success || !parsed.ok) return { ok: false, error: "invalid" }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO notes_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN notes_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE notes_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN notes_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE notes_rate_limits.window_start
        END
      RETURNING hits
    ),
    upd AS (
      UPDATE notes_notes
      SET title = ${parsed.title}, body = ${parsed.body}, updated_at = now()
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

export async function deleteNote(sql: Sql, userId: string, idValue: unknown): Promise<Result> {
  const id = parseId(idValue)
  if (!id.success) return { ok: false, error: "invalid" }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO notes_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN notes_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE notes_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN notes_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE notes_rate_limits.window_start
        END
      RETURNING hits
    ),
    del AS (
      DELETE FROM notes_notes
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
