import 'server-only'
import { INGEST_LIMIT, INGEST_WINDOW_SEC, LOGIN_MAX_FAILURES, LOGIN_WINDOW_MIN } from './constants'
import { db } from './db'

export async function allowIngest(ip: string): Promise<boolean> {
  const sql = await db()
  const rows = await sql`
    INSERT INTO rate_limits (bucket, hits, window_start, locked_until)
    VALUES (${`ingest:${ip}`}, 1, now(), NULL)
    ON CONFLICT (bucket) DO UPDATE SET
      hits = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${INGEST_WINDOW_SEC}) THEN 1
        ELSE rate_limits.hits + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${INGEST_WINDOW_SEC}) THEN now()
        ELSE rate_limits.window_start
      END,
      locked_until = NULL
    RETURNING hits
  `
  return Number(rows[0]?.hits ?? 0) <= INGEST_LIMIT
}

export async function loginLocked(ip: string): Promise<boolean> {
  const sql = await db()
  const rows = await sql`
    SELECT 1 AS locked
    FROM rate_limits
    WHERE bucket = ${`login:${ip}`}
      AND locked_until IS NOT NULL
      AND locked_until > now()
  `
  return rows.length > 0
}

export async function recordLoginFailure(ip: string): Promise<boolean> {
  const sql = await db()
  const rows = await sql`
    INSERT INTO rate_limits (bucket, hits, window_start, locked_until)
    VALUES (${`login:${ip}`}, 1, now(), NULL)
    ON CONFLICT (bucket) DO UPDATE SET
      hits = CASE
        WHEN rate_limits.locked_until IS NOT NULL AND rate_limits.locked_until > now() THEN rate_limits.hits
        WHEN rate_limits.window_start <= now() - make_interval(mins => ${LOGIN_WINDOW_MIN}) THEN 1
        ELSE rate_limits.hits + 1
      END,
      window_start = CASE
        WHEN rate_limits.locked_until IS NOT NULL AND rate_limits.locked_until > now() THEN rate_limits.window_start
        WHEN rate_limits.window_start <= now() - make_interval(mins => ${LOGIN_WINDOW_MIN}) THEN now()
        ELSE rate_limits.window_start
      END,
      locked_until = CASE
        WHEN rate_limits.locked_until IS NOT NULL AND rate_limits.locked_until > now() THEN rate_limits.locked_until
        WHEN (
          CASE
            WHEN rate_limits.window_start <= now() - make_interval(mins => ${LOGIN_WINDOW_MIN}) THEN 1
            ELSE rate_limits.hits + 1
          END
        ) >= ${LOGIN_MAX_FAILURES} THEN now() + make_interval(mins => ${LOGIN_WINDOW_MIN})
        ELSE NULL
      END
    RETURNING locked_until
  `
  const lockedUntil = rows[0]?.locked_until
  if (!lockedUntil) return false
  const date = lockedUntil instanceof Date ? lockedUntil : new Date(String(lockedUntil))
  return date.getTime() > Date.now()
}

export async function clearLoginFailures(ip: string): Promise<void> {
  const sql = await db()
  await sql`DELETE FROM rate_limits WHERE bucket = ${`login:${ip}`}`
}
