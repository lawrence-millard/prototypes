import { createSql, deleteSql, listSql, publicSql, schemaStatements, updateSql, windowSeconds, writeLimit } from './queries'
import { createSchema, deleteSchema, slugSchema, updateSchema } from './schemas'
import type { EventItem, PublicEvent, Queryable, Result } from './types'

type WriteRow = { count: number | string; id: string | null; slug: string | null }

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).toISOString()
  throw new Error('bad date')
}

function slug() {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  return Buffer.from(bytes).toString('base64url')
}

function unique(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505'
}

function outcome(row: WriteRow | undefined): Result<{ id: string; slug: string }> {
  if (!row) return { ok: false, error: 'could not save.' }
  if (!row.id || !row.slug) {
    if (Number(row.count) > writeLimit) return { ok: false, error: 'slow down.' }
    return { ok: false, error: 'not found.' }
  }
  return { ok: true, data: { id: row.id, slug: row.slug } }
}

export async function ensure(db: Queryable) {
  for (const statement of schemaStatements) await db.query(statement)
}

export async function listEvents(db: Queryable, userId: string): Promise<EventItem[]> {
  const rows = await db.query<{ id: string; slug: string; title: string; note: string; happens_at: string | Date }>(listSql, [userId])
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    note: row.note,
    happensAt: iso(row.happens_at),
  }))
}

export async function readPublic(db: Queryable, slugValue: string): Promise<PublicEvent | null> {
  const parsed = slugSchema.safeParse(slugValue)
  if (!parsed.success) return null
  const rows = await db.query<{ title: string; note: string; happens_at: string | Date }>(publicSql, [parsed.data])
  const row = rows[0]
  if (!row) return null
  return { title: row.title, note: row.note, happensAt: iso(row.happens_at) }
}

export async function createEvent(db: Queryable, userId: string, input: unknown): Promise<Result<{ id: string; slug: string }>> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid.' }
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = crypto.randomUUID()
    try {
      const rows = await db.query<WriteRow>(createSql, [
        `write:${userId}`,
        windowSeconds,
        id,
        userId,
        slug(),
        parsed.data.title,
        parsed.data.note,
        new Date(parsed.data.happensAt).toISOString(),
        writeLimit,
      ])
      return outcome(rows[0])
    } catch (error) {
      if (!unique(error) || attempt === 2) {
        if (unique(error)) return { ok: false, error: 'could not save.' }
        throw error
      }
    }
  }
  return { ok: false, error: 'could not save.' }
}

export async function updateEvent(db: Queryable, userId: string, input: unknown) {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  const rows = await db.query<WriteRow>(updateSql, [
    `write:${userId}`,
    windowSeconds,
    parsed.data.id,
    userId,
    parsed.data.title,
    parsed.data.note,
    new Date(parsed.data.happensAt).toISOString(),
    writeLimit,
  ])
  return outcome(rows[0])
}

export async function deleteEvent(db: Queryable, userId: string, input: unknown) {
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  const rows = await db.query<WriteRow>(deleteSql, [
    `write:${userId}`,
    windowSeconds,
    parsed.data.id,
    userId,
    writeLimit,
  ])
  return outcome(rows[0])
}
