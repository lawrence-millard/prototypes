import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { decryptSecret, encryptSecret } from '../../apps/secret/lib/crypto.ts'
import { createSecret, deleteSecret, ensure, listSecrets, openLink, updateSecret } from '../../apps/secret/lib/flow.ts'
import { listSql } from '../../apps/secret/lib/queries.ts'
import { securityHeaders } from '../../apps/secret/lib/security-headers.ts'
import { createDb } from './harness.ts'

const db = await createDb()

test('aes-gcm round trip stays off the server payload', async () => {
  const sealed = await encryptSecret('the quiet part')
  assert.equal(sealed.key.length, 43)
  assert.equal(sealed.ciphertext.includes('the quiet part'), false)
  assert.equal(await decryptSecret(sealed.ciphertext, sealed.iv, sealed.key), 'the quiet part')
  const tampered = sealed.ciphertext.slice(0, -2) + (sealed.ciphertext.endsWith('A=') ? 'B=' : 'A=')
  await assert.rejects(() => decryptSecret(tampered, sealed.iv, sealed.key))
  await assert.rejects(() => decryptSecret(sealed.ciphertext, sealed.iv, 'a'.repeat(43)))
})

test('a link opens once and only the owner can manage it', async () => {
  await ensure(db)
  assert.doesNotMatch(listSql, /ciphertext/)
  const sealed = await encryptSecret('meet at dawn')
  const created = await createSecret(db, 'user_a', { ciphertext: sealed.ciphertext, iv: sealed.iv, expiresIn: '1d' })
  assert.equal(created.ok, true)
  if (!created.ok) return
  const stored = await db.query<{ ciphertext: string; iv: string }>('SELECT ciphertext, iv FROM secret_links WHERE user_id = $1', ['user_a'])
  assert.equal(stored[0]?.ciphertext, sealed.ciphertext)
  assert.equal(JSON.stringify(stored).includes('meet at dawn'), false)
  const listed = await listSecrets(db, 'user_a')
  assert.equal(listed.length, 1)
  assert.equal('ciphertext' in listed[0]!, false)
  assert.equal((await listSecrets(db, 'user_b')).length, 0)
  assert.equal((await deleteSecret(db, 'user_b', { id: created.data.id })).ok, false)
  assert.equal((await updateSecret(db, 'user_a', { id: created.data.id, expiresIn: '1h' })).ok, true)
  const opened = await openLink(db, 'reader', { id: created.data.id })
  assert.equal(opened.ok, true)
  if (!opened.ok) return
  assert.equal(await decryptSecret(opened.data.ciphertext, opened.data.iv, sealed.key), 'meet at dawn')
  assert.deepEqual(await openLink(db, 'reader-2', { id: created.data.id }), { ok: false, error: 'gone.' })
  assert.equal((await listSecrets(db, 'user_a')).length, 0)
})

test('expired ciphertext is deleted instead of returned', async () => {
  const sealed = await encryptSecret('old')
  const created = await createSecret(db, 'user_a', { ciphertext: sealed.ciphertext, iv: sealed.iv, expiresIn: '1h' })
  assert.equal(created.ok, true)
  if (!created.ok) return
  await db.query(`UPDATE secret_links SET expires_at = now() - interval '1 minute' WHERE id = $1`, [created.data.id])
  assert.deepEqual(await openLink(db, 'reader', { id: created.data.id }), { ok: false, error: 'gone.' })
  const left = await db.query('SELECT id FROM secret_links WHERE id = $1', [created.data.id])
  assert.equal(left.length, 0)
})

test('create rate limit', async () => {
  const sealed = await encryptSecret('n')
  let last: { ok: boolean; error?: string } = { ok: true }
  for (let index = 0; index < 11; index++) {
    last = await createSecret(db, 'user_limit', { ciphertext: sealed.ciphertext, iv: sealed.iv, expiresIn: '1h' })
  }
  assert.deepEqual(last, { ok: false, error: 'slow down.' })
})

test('referrer policy does not send the secret path', () => {
  const headers = securityHeaders({ nodeEnv: 'production', publishableKey: '', referrer: 'no-referrer' })
  assert.equal(headers.find((header) => header.key === 'Referrer-Policy')?.value, 'no-referrer')
  const csp = headers.find((header) => header.key === 'Content-Security-Policy')?.value ?? ''
  assert.match(csp, /https:\/\/clerk\.millard\.ink/)
  assert.doesNotMatch(csp, /vercel\.app/)
})

after(async () => {
  await db.close()
})
