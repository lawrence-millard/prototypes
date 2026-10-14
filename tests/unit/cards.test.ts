import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createCard, createDeck, deleteCard, deleteDeck, ensure, getDeck, listDecks, renameDeck, reviewCard, updateCard } from '../../apps/cards/lib/flow.ts'
import { nextReview } from '../../apps/cards/lib/srs.ts'
import { createDb } from './harness.ts'

const db = await createDb()

test('spaced repetition stretches and resets', () => {
  const now = new Date('2026-10-14T12:00:00Z')
  const first = nextReview({ ease: 2.5, intervalDays: 0, repetitions: 0 }, 'good', now)
  assert.equal(first.intervalDays, 1)
  assert.equal(first.repetitions, 1)
  const second = nextReview(first, 'good', now)
  assert.equal(second.intervalDays, 6)
  const third = nextReview(second, 'good', now)
  assert.equal(third.intervalDays, 15)
  const easy = nextReview({ ease: 2.5, intervalDays: 0, repetitions: 0 }, 'easy', now)
  assert.equal(easy.intervalDays, 4)
  assert.equal(easy.ease, 2.65)
  const again = nextReview(third, 'again', now)
  assert.equal(again.repetitions, 0)
  assert.equal(again.intervalDays, 0)
  assert.equal(again.dueAt.getTime() - now.getTime(), 10 * 60 * 1000)
})

test('decks and reviews are scoped to the owner', async () => {
  await ensure(db)
  const deckId = crypto.randomUUID()
  const cardId = crypto.randomUUID()
  assert.equal((await createDeck(db, 'user_a', { id: deckId, name: '  verbs  ' })).ok, true)
  assert.equal((await listDecks(db, 'user_b')).length, 0)
  assert.equal(await getDeck(db, 'user_b', deckId), null)
  assert.equal((await renameDeck(db, 'user_b', { id: deckId, name: 'stolen' })).ok, false)
  assert.equal((await createCard(db, 'user_b', { id: cardId, deckId, front: 'x', back: 'y' })).ok, false)
  assert.equal((await createCard(db, 'user_a', { id: cardId, deckId, front: '  go  ', back: 'went' })).ok, true)
  const deck = await getDeck(db, 'user_a', deckId)
  assert.equal(deck?.name, 'verbs')
  assert.equal(deck?.cards[0]?.front, 'go')
  assert.equal((await listDecks(db, 'user_a'))[0]?.due, 1)
  const graded = await reviewCard(db, 'user_a', { id: cardId, grade: 'good' })
  assert.equal(graded.ok, true)
  const after = await getDeck(db, 'user_a', deckId)
  assert.equal(after?.cards[0]?.intervalDays, 1)
  assert.equal(after?.cards[0]?.repetitions, 1)
  assert.equal((await reviewCard(db, 'user_b', { id: cardId, grade: 'again' })).ok, false)
  assert.equal((await getDeck(db, 'user_a', deckId))?.cards[0]?.repetitions, 1)
  assert.equal((await updateCard(db, 'user_a', { id: cardId, front: 'go', back: 'gone' })).ok, true)
  assert.equal((await getDeck(db, 'user_a', deckId))?.cards[0]?.back, 'gone')
  assert.equal((await getDeck(db, 'user_a', deckId))?.cards[0]?.repetitions, 1)
  assert.equal((await deleteCard(db, 'user_b', { id: cardId })).ok, false)
  assert.equal((await deleteDeck(db, 'user_a', { id: deckId })).ok, true)
  assert.equal(await getDeck(db, 'user_a', deckId), null)
  const leftover = await db.query<{ count: string }>('SELECT count(*)::int AS count FROM cards_cards WHERE deck_id = $1', [deckId])
  assert.equal(Number(leftover[0]?.count), 0)
})

after(async () => {
  await db.close()
})
