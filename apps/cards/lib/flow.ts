import {
  cardStateSql,
  createCardSql,
  createDeckSql,
  deckSql,
  deleteCardSql,
  deleteDeckSql,
  listDecksSql,
  renameDeckSql,
  reviewSql,
  schemaStatements,
  updateCardSql,
  windowSeconds,
  writeLimit,
} from './queries'
import { createCardSchema, createDeckSchema, deleteCardSchema, deleteDeckSchema, renameDeckSchema, reviewSchema, updateCardSchema } from './schemas'
import { nextReview } from './srs'
import type { Card, Deck, DeckDetail, Queryable, Result } from './types'

type WriteRow = { count: number | string; id: string | null }

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).toISOString()
  throw new Error('bad date')
}

function outcome(row: WriteRow | undefined): Result<{ id: string }> {
  if (!row) return { ok: false, error: 'could not save.' }
  if (!row.id) {
    if (Number(row.count) > writeLimit) return { ok: false, error: 'slow down.' }
    return { ok: false, error: 'not found.' }
  }
  return { ok: true, data: { id: row.id } }
}

async function write(db: Queryable, sql: string, values: unknown[]) {
  const rows = await db.query<WriteRow>(sql, [`write:${values[0]}`, windowSeconds, ...values.slice(1)])
  return outcome(rows[0])
}

export async function ensure(db: Queryable) {
  for (const statement of schemaStatements) await db.query(statement)
}

export async function listDecks(db: Queryable, userId: string): Promise<Deck[]> {
  const rows = await db.query<{ id: string; name: string; cards: number; due: number }>(listDecksSql, [userId])
  return rows.map((row) => ({ id: row.id, name: row.name, cards: Number(row.cards), due: Number(row.due) }))
}

export async function getDeck(db: Queryable, userId: string, deckId: string): Promise<DeckDetail | null> {
  const rows = await db.query<{
    deck_id: string
    name: string
    card_id: string | null
    front: string | null
    back: string | null
    ease: number | null
    interval_days: number | null
    repetitions: number | null
    due_at: string | Date | null
    created_at: string | Date | null
  }>(deckSql, [deckId, userId])
  const first = rows[0]
  if (!first) return null
  const cards: Card[] = rows.flatMap((row) => {
    if (!row.card_id || !row.front || !row.back || row.due_at == null || row.created_at == null) return []
    return [{
      id: row.card_id,
      front: row.front,
      back: row.back,
      ease: Number(row.ease),
      intervalDays: Number(row.interval_days),
      repetitions: Number(row.repetitions),
      dueAt: iso(row.due_at),
      createdAt: iso(row.created_at),
    }]
  })
  return { id: first.deck_id, name: first.name, cards }
}

export async function createDeck(db: Queryable, userId: string, input: unknown) {
  const parsed = createDeckSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  return write(db, createDeckSql, [userId, parsed.data.id, userId, parsed.data.name, writeLimit])
}

export async function renameDeck(db: Queryable, userId: string, input: unknown) {
  const parsed = renameDeckSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  return write(db, renameDeckSql, [userId, parsed.data.id, userId, parsed.data.name, writeLimit])
}

export async function deleteDeck(db: Queryable, userId: string, input: unknown) {
  const parsed = deleteDeckSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  return write(db, deleteDeckSql, [userId, parsed.data.id, userId, writeLimit])
}

export async function createCard(db: Queryable, userId: string, input: unknown) {
  const parsed = createCardSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  return write(db, createCardSql, [userId, parsed.data.id, parsed.data.deckId, userId, parsed.data.front, parsed.data.back, writeLimit])
}

export async function updateCard(db: Queryable, userId: string, input: unknown) {
  const parsed = updateCardSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  return write(db, updateCardSql, [userId, parsed.data.id, userId, parsed.data.front, parsed.data.back, writeLimit])
}

export async function deleteCard(db: Queryable, userId: string, input: unknown) {
  const parsed = deleteCardSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid.' }
  return write(db, deleteCardSql, [userId, parsed.data.id, userId, writeLimit])
}

export async function reviewCard(db: Queryable, userId: string, input: unknown): Promise<Result<{ id: string; dueAt: string }>> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid.' }
  const current = await db.query<{ ease: number; interval_days: number; repetitions: number }>(cardStateSql, [parsed.data.id, userId])
  const row = current[0]
  if (!row) return { ok: false, error: 'not found.' }
  const next = nextReview({ ease: Number(row.ease), intervalDays: Number(row.interval_days), repetitions: Number(row.repetitions) }, parsed.data.grade, new Date())
  const saved = await write(db, reviewSql, [
    userId,
    parsed.data.id,
    userId,
    next.ease,
    next.intervalDays,
    next.repetitions,
    next.dueAt.toISOString(),
    row.repetitions,
    writeLimit,
  ])
  if (!saved.ok) return saved
  return { ok: true, data: { id: saved.data.id, dueAt: next.dueAt.toISOString() } }
}
