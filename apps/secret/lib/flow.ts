import { createSql, deleteSql, listSql, openLimit, openSql, purgeSql, schemaStatements, updateSql, windowSeconds, writeLimit } from './queries'
import { createSchema, deleteSchema, expirySeconds, openSchema, updateSchema } from './schemas'
import type { Queryable, Result, SecretItem } from './types'

type WriteRow = { count: number | string; id: string | null }
type OpenRow = { count: number | string; ciphertext: string | null; iv: string | null; fresh: boolean | null }

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).toISOString()
  throw new Error('bad date')
}

function secretId() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return Buffer.from(bytes).toString('base64url')
}

function outcome(row: WriteRow | undefined): Result<{ id: string }> {
  if (!row) return { ok: false, error: 'could not save.' }
  if (!row.id) {
    if (Number(row.count) > writeLimit) return { ok: false, error: 'slow down.' }
    return { ok: false, error: 'not found.' }
  }
  return { ok: true, data: { id: row.id } }
}

function expiresAt(expiresIn: keyof typeof expirySeconds) {
  return new Date(Date.now() + expirySeconds[expiresIn] * 1000).toISOString()
}

export async function ensure(db: Queryable) {
  for (const statement of schemaStatements) await db.query(statement)
}

export async function listSecrets(db: Queryable, userId: string): Promise<SecretItem[]> {
  const [, rows] = await db.batch([
    { text: purgeSql, values: [userId] },
    { text: listSql, values: [userId] },
  ])
  return (rows as { id: string; expires_at: string | Date; created_at: string | Date }[]).map((row) => ({
    id: row.id,
    expiresAt: iso(row.expires_at),
    createdAt: iso(row.created_at),
  }))
}

export async function createSecret(db: Queryable, userId: string, input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid.' }
  const rows = await db.query<WriteRow>(createSql, [
    `write:${userId}`,
    windowSeconds,
    secretId(),
    userId,
    parsed.data.ciphertext,
    parsed.data.iv,
    expiresAt(parsed.data.expiresIn),
    writeLimit,
  ])
  return outcome(rows[0])
}

export async function updateSecret(db: Queryable, userId: string, input: unknown) {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  const rows = await db.query<WriteRow>(updateSql, [
    `write:${userId}`,
    windowSeconds,
    parsed.data.id,
    userId,
    expiresAt(parsed.data.expiresIn),
    writeLimit,
  ])
  return outcome(rows[0])
}

export async function deleteSecret(db: Queryable, userId: string, input: unknown) {
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

export async function openLink(db: Queryable, bucket: string, input: unknown): Promise<Result<{ ciphertext: string; iv: string }>> {
  const parsed = openSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid.' }
  if (!/^[a-z0-9:-]{1,80}$/i.test(bucket)) return { ok: false, error: 'invalid.' }
  const rows = await db.query<OpenRow>(openSql, [`open:${bucket}`, windowSeconds, parsed.data.id, openLimit])
  const row = rows[0]
  if (!row) return { ok: false, error: 'could not open.' }
  if (row.fresh && row.ciphertext && row.iv) return { ok: true, data: { ciphertext: row.ciphertext, iv: row.iv } }
  if (row.fresh === false) return { ok: false, error: 'gone.' }
  if (Number(row.count) > openLimit) return { ok: false, error: 'slow down.' }
  return { ok: false, error: 'gone.' }
}
