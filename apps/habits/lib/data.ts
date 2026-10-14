import { randomUUID } from "node:crypto"
import { utcToday } from "./dates"
import { LIST_LIMIT, WRITE_LIMIT } from "./limits"
import type { Sql } from "./sql"
import { parseId, parseName, parseToggle } from "./validate"

export type Habit = { id: string; name: string; days: string[] }
export type Fail = "invalid" | "rate" | "unavailable" | "missing" | "limit"
export type Result = { ok: true; id: string } | { ok: false; error: Fail }

function daysOf(value: unknown) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

function nums(row: Record<string, unknown> | undefined) {
  return {
    hits: Number(row?.hits ?? 0),
    n: Number(row?.n ?? 0),
    id: row?.id ? String(row.id) : "",
    owned: row?.owned ? String(row.owned) : "",
  }
}

export async function listHabits(sql: Sql, userId: string): Promise<Habit[]> {
  const rows = await sql`
    SELECT h.id, h.name,
      COALESCE(json_agg(c.day ORDER BY c.day) FILTER (WHERE c.day IS NOT NULL), '[]'::json) AS days
    FROM habits_habits h
    LEFT JOIN habits_checks c ON c.habit_id = h.id AND c.user_id = h.user_id
    WHERE h.user_id = ${userId}
    GROUP BY h.id, h.name, h.created_at
    ORDER BY h.created_at DESC
    LIMIT ${LIST_LIMIT}
  `
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    days: daysOf(row.days),
  }))
}

export async function createHabit(sql: Sql, userId: string, nameValue: unknown): Promise<Result> {
  const parsed = parseName(nameValue)
  if (!parsed.ok) return parsed
  const rows = await sql`
    WITH rate AS (
      INSERT INTO habits_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE habits_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE habits_rate_limits.window_start
        END
      RETURNING hits
    ),
    room AS (
      SELECT count(*)::int AS n FROM habits_habits WHERE user_id = ${userId}
    ),
    ins AS (
      INSERT INTO habits_habits (id, user_id, name)
      SELECT ${randomUUID()}, ${userId}, ${parsed.name}
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

export async function renameHabit(sql: Sql, userId: string, idValue: unknown, nameValue: unknown): Promise<Result> {
  const id = parseId(idValue)
  const parsed = parseName(nameValue)
  if (!id.success || !parsed.ok) return { ok: false, error: "invalid" }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO habits_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE habits_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE habits_rate_limits.window_start
        END
      RETURNING hits
    ),
    upd AS (
      UPDATE habits_habits
      SET name = ${parsed.name}
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

export async function setCheck(sql: Sql, userId: string, input: { id: unknown; on: unknown; day: unknown }, now = new Date()): Promise<Result> {
  const parsed = parseToggle(input)
  if (!parsed.ok) return parsed
  if (parsed.day !== utcToday(now)) return { ok: false, error: "invalid" }
  const rows = parsed.on
    ? await sql`
        WITH rate AS (
          INSERT INTO habits_rate_limits (bucket, hits, window_start)
          VALUES (${`write:${userId}`}, 1, now())
          ON CONFLICT (bucket) DO UPDATE SET
            hits = CASE
              WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
              ELSE habits_rate_limits.hits + 1
            END,
            window_start = CASE
              WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
              ELSE habits_rate_limits.window_start
            END
          RETURNING hits
        ),
        own AS (
          SELECT id FROM habits_habits WHERE id = ${parsed.id} AND user_id = ${userId}
        ),
        ins AS (
          INSERT INTO habits_checks (habit_id, user_id, day)
          SELECT ${parsed.id}, ${userId}, ${parsed.day}
          WHERE EXISTS (SELECT 1 FROM own)
            AND (SELECT hits FROM rate) <= ${WRITE_LIMIT}
          ON CONFLICT (habit_id, day) DO NOTHING
          RETURNING habit_id
        )
        SELECT (SELECT hits FROM rate) AS hits, (SELECT id FROM own) AS owned, (SELECT habit_id FROM ins) AS id
      `
    : await sql`
        WITH rate AS (
          INSERT INTO habits_rate_limits (bucket, hits, window_start)
          VALUES (${`write:${userId}`}, 1, now())
          ON CONFLICT (bucket) DO UPDATE SET
            hits = CASE
              WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
              ELSE habits_rate_limits.hits + 1
            END,
            window_start = CASE
              WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
              ELSE habits_rate_limits.window_start
            END
          RETURNING hits
        ),
        own AS (
          SELECT id FROM habits_habits WHERE id = ${parsed.id} AND user_id = ${userId}
        ),
        del AS (
          DELETE FROM habits_checks
          WHERE habit_id = ${parsed.id} AND user_id = ${userId} AND day = ${parsed.day}
            AND EXISTS (SELECT 1 FROM own)
            AND (SELECT hits FROM rate) <= ${WRITE_LIMIT}
          RETURNING habit_id
        )
        SELECT (SELECT hits FROM rate) AS hits, (SELECT id FROM own) AS owned
      `
  const row = nums(rows[0])
  if (row.hits > WRITE_LIMIT) return { ok: false, error: "rate" }
  if (!row.owned) return { ok: false, error: "missing" }
  return { ok: true, id: parsed.id }
}

export async function deleteHabit(sql: Sql, userId: string, idValue: unknown): Promise<Result> {
  const id = parseId(idValue)
  if (!id.success) return { ok: false, error: "invalid" }
  const rows = await sql`
    WITH rate AS (
      INSERT INTO habits_rate_limits (bucket, hits, window_start)
      VALUES (${`write:${userId}`}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN 1
          ELSE habits_rate_limits.hits + 1
        END,
        window_start = CASE
          WHEN habits_rate_limits.window_start <= now() - interval '10 minutes' THEN now()
          ELSE habits_rate_limits.window_start
        END
      RETURNING hits
    ),
    del AS (
      DELETE FROM habits_habits
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
