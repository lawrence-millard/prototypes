import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createSession, deleteSession, ensure, listSessions, updateSession } from '../../apps/focus/lib/flow.ts'
import { schemaStatements } from '../../apps/focus/lib/queries.ts'
import { securityHeaders } from '../../apps/focus/lib/security-headers.ts'
import { createDb } from './harness.ts'

const db = await createDb()
const user = 'user_a'
const other = 'user_b'

before(async () => {
  await ensure(db)
})

after(async () => {
  await db.close()
})

test('tables are created idempotently and prefixed', async () => {
  assert.ok(schemaStatements.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS focus_sessions')))
  assert.ok(schemaStatements.some((statement) => statement.includes('CREATE TABLE IF NOT EXISTS focus_limits')))
  await ensure(db)
})

test('sessions stay on the owner account', async () => {
  const id = crypto.randomUUID()
  const created = await createSession(db, user, { id, kind: 'focus', seconds: 1500, label: '  deep   work ' })
  assert.equal(created.ok, true)
  const mine = await listSessions(db, user)
  const theirs = await listSessions(db, other)
  assert.equal(mine.length, 1)
  assert.equal(mine[0]?.label, 'deep work')
  assert.equal(theirs.length, 0)
  const renamed = await updateSession(db, other, { id, label: 'nope' })
  assert.deepEqual(renamed, { ok: false, error: 'not found.' })
  const removed = await deleteSession(db, other, { id })
  assert.deepEqual(removed, { ok: false, error: 'not found.' })
  assert.equal((await listSessions(db, user))[0]?.label, 'deep work')
  const edited = await updateSession(db, user, { id, label: 'ship' })
  assert.equal(edited.ok, true)
  assert.equal((await listSessions(db, user))[0]?.label, 'ship')
  assert.equal((await deleteSession(db, user, { id })).ok, true)
  assert.equal((await listSessions(db, user)).length, 0)
})

test('rejects a session that does not match a preset', async () => {
  const result = await createSession(db, user, { id: crypto.randomUUID(), kind: 'focus', seconds: 10, label: '' })
  assert.deepEqual(result, { ok: false, error: 'invalid.' })
})

test('a repeated save uses the same id', async () => {
  const id = crypto.randomUUID()
  const input = { id, kind: 'short' as const, seconds: 300, label: 'walk' }
  assert.equal((await createSession(db, user, input)).ok, true)
  assert.equal((await createSession(db, user, input)).ok, true)
  const rows = await listSessions(db, user)
  assert.equal(rows.filter((row) => row.id === id).length, 1)
  await deleteSession(db, user, { id })
})

test('write rate limit resets with the window', async () => {
  const ids: string[] = []
  for (let index = 0; index < 30; index++) {
    const id = crypto.randomUUID()
    ids.push(id)
    const result = await createSession(db, 'user_limit', { id, kind: 'long', seconds: 900, label: '' })
    assert.equal(result.ok, true, `write ${index}`)
  }
  const blocked = await createSession(db, 'user_limit', { id: crypto.randomUUID(), kind: 'long', seconds: 900, label: '' })
  assert.deepEqual(blocked, { ok: false, error: 'slow down.' })
  await db.query(`UPDATE focus_limits SET window_start = now() - interval '1 hour' WHERE bucket = $1`, ['write:user_limit'])
  const again = await createSession(db, 'user_limit', { id: crypto.randomUUID(), kind: 'long', seconds: 900, label: '' })
  assert.equal(again.ok, true)
  for (const id of ids) await deleteSession(db, 'user_limit', { id })
})

test('security headers allow the production Clerk host and block telemetry', () => {
  const headers = securityHeaders({
    nodeEnv: 'production',
    publishableKey: 'pk_live_' + Buffer.from('clerk.millard.ink$').toString('base64'),
    referrer: 'strict-origin-when-cross-origin',
  })
  const csp = headers.find((header) => header.key === 'Content-Security-Policy')?.value ?? ''
  assert.match(csp, /https:\/\/clerk\.millard\.ink/)
  assert.doesNotMatch(csp, /unsafe-eval/)
  assert.doesNotMatch(csp, /vercel\.app/)
  assert.doesNotMatch(csp, /clerk-telemetry/)
  assert.equal(headers.find((header) => header.key === 'X-Content-Type-Options')?.value, 'nosniff')
  assert.equal(headers.find((header) => header.key === 'X-Frame-Options')?.value, 'DENY')
  const dev = securityHeaders({ nodeEnv: 'development', publishableKey: '', referrer: 'strict-origin-when-cross-origin' })
  assert.match(dev.find((header) => header.key === 'Content-Security-Policy')?.value ?? '', /unsafe-eval/)
})
