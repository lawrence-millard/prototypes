import { createSchema, deleteSchema, updateSchema } from './schemas'
import { createSql, deleteSql, listSql, schemaStatements, updateSql, windowSeconds, writeLimit } from './queries'
import type { Queryable, Result, Session } from './types'

type WriteRow = { count: number | string; id: string | null }

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).toISOString()
  throw new Error('bad date')
}

function outcome(row: WriteRow | undefined, limit: number): Result<{ id: string }> {
  if (!row) return { ok: false, error: 'could not save.' }
  if (!row.id) {
    if (Number(row.count) > limit) return { ok: false, error: 'slow down.' }
    return { ok: false, error: 'not found.' }
  }
  return { ok: true, data: { id: row.id } }
}

export async function ensure(db: Queryable) {
  for (const statement of schemaStatements) await db.query(statement)
}

export async function listSessions(db: Queryable, userId: string): Promise<Session[]> {
  const rows = await db.query<{ id: string; kind: Session['kind']; seconds: number; label: string; completed_at: string | Date }>(listSql, [userId])
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    seconds: Number(row.seconds),
    label: row.label,
    completedAt: iso(row.completed_at),
  }))
}

export async function createSession(db: Queryable, userId: string, input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid.' }
  const rows = await db.query<WriteRow>(createSql, [
    `write:${userId}`,
    windowSeconds,
    parsed.data.id,
    userId,
    parsed.data.kind,
    parsed.data.seconds,
    parsed.data.label,
    writeLimit,
  ])
  return outcome(rows[0], writeLimit)
}

export async function updateSession(db: Queryable, userId: string, input: unknown): Promise<Result<{ id: string }>> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid.' }
  const rows = await db.query<WriteRow>(updateSql, [
    `write:${userId}`,
    windowSeconds,
    parsed.data.id,
    userId,
    parsed.data.label,
    writeLimit,
  ])
  return outcome(rows[0], writeLimit)
}

export async function deleteSession(db: Queryable, userId: string, input: unknown): Promise<Result<{ id: string }>> {
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid.' }
  const rows = await db.query<WriteRow>(deleteSql, [
    `write:${userId}`,
    windowSeconds,
    parsed.data.id,
    userId,
    writeLimit,
  ])
  return outcome(rows[0], writeLimit)
}
