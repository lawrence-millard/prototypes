import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createEvent, deleteEvent, ensure, listEvents, readPublic, updateEvent } from '../../apps/soon/lib/flow.ts'
import { publicSql } from '../../apps/soon/lib/queries.ts'
import { remainingLabel } from '../../apps/soon/lib/remain.ts'
import { createDb } from './harness.ts'

const db = await createDb()
const now = Date.parse('2026-10-14T12:00:00Z')

test('countdown labels', () => {
  assert.equal(remainingLabel('2026-10-14T11:00:00Z', now), 'passed')
  assert.equal(remainingLabel('2026-10-14T15:00:00Z', now), '3h 00m 00s')
  assert.equal(remainingLabel('2026-10-16T16:30:00Z', now), '2d 4h 30m')
})

test('events are private except the public page', async () => {
  await ensure(db)
  assert.doesNotMatch(publicSql, /user_id/)
  const happensAt = '2026-12-01T18:00:00.000Z'
  const created = await createEvent(db, 'user_a', { title: '  launch  ', note: ' hall ', happensAt })
  assert.equal(created.ok, true)
  if (!created.ok) return
  const mine = await listEvents(db, 'user_a')
  const theirs = await listEvents(db, 'user_b')
  assert.equal(mine.length, 1)
  assert.equal(mine[0]?.title, 'launch')
  assert.equal(mine[0]?.note, 'hall')
  assert.equal(theirs.length, 0)
  const pub = await readPublic(db, created.data.slug)
  assert.deepEqual(pub && Object.keys(pub).sort(), ['happensAt', 'note', 'title'])
  assert.equal(pub?.title, 'launch')
  assert.equal(await readPublic(db, 'not-a-slug'), null)
  assert.equal((await updateEvent(db, 'user_b', { id: created.data.id, title: 'no', note: '', happensAt })).ok, false)
  const edited = await updateEvent(db, 'user_a', { id: created.data.id, title: 'ship', note: '', happensAt: '2026-12-02T18:00:00.000Z' })
  assert.equal(edited.ok, true)
  if (!edited.ok) return
  assert.equal((await readPublic(db, edited.data.slug))?.title, 'ship')
  assert.equal((await deleteEvent(db, 'user_b', { id: created.data.id })).ok, false)
  assert.equal((await deleteEvent(db, 'user_a', { id: created.data.id })).ok, true)
  assert.equal(await readPublic(db, created.data.slug), null)
})

test('rejects a date outside the allowed range', async () => {
  const result = await createEvent(db, 'user_a', { title: 'far', note: '', happensAt: '2200-01-01T00:00:00.000Z' })
  assert.deepEqual(result, { ok: false, error: 'invalid.' })
})

after(async () => {
  await db.close()
})
