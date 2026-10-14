import { describe, expect, it } from 'vitest'
import type { PushChange } from '../sync/contract'
import { handleBoards, type SyncDeps } from './boards'

function deps(partial: Partial<SyncDeps> = {}): SyncDeps & { writes: Array<{ ownerId: string; changes: PushChange[] }> } {
  const writes: Array<{ ownerId: string; changes: PushChange[] }> = []
  return {
    writes,
    verify: async (token) => (token === 'good' ? 'user_a' : null),
    takeToken: async () => true,
    readBoards: async () => [],
    writeBoards: async (ownerId, changes) => {
      writes.push({ ownerId, changes })
    },
    ...partial,
  }
}

const validChange = {
  id: 'board_1',
  name: 'Flow',
  createdAt: 1,
  updatedAt: 2,
  shapes: [],
  connectors: [],
}

describe('handleBoards', () => {
  it('rejects missing and foreign tokens', async () => {
    const store = deps()
    const missing = await handleBoards(new Request('http://local/api/boards'), store)
    expect(missing.status).toBe(401)
    const foreign = await handleBoards(
      new Request('http://local/api/boards', { headers: { authorization: 'Bearer other' } }),
      store,
    )
    expect(foreign.status).toBe(401)
    expect(store.writes).toEqual([])
  })

  it('writes only for the verified user and refuses invalid bodies', async () => {
    const store = deps()
    const bad = await handleBoards(
      new Request('http://local/api/boards', {
        method: 'PUT',
        headers: { authorization: 'Bearer good' },
        body: JSON.stringify({ ownerId: 'user_b', changes: [validChange] }),
      }),
      store,
    )
    expect(bad.status).toBe(400)
    expect(store.writes).toEqual([])

    const ok = await handleBoards(
      new Request('http://local/api/boards', {
        method: 'PUT',
        headers: { authorization: 'Bearer good' },
        body: JSON.stringify({ changes: [validChange] }),
      }),
      store,
    )
    expect(ok.status).toBe(200)
    expect(store.writes).toEqual([{ ownerId: 'user_a', changes: [validChange] }])
  })

  it('rate limits before reading or writing', async () => {
    const store = deps({ takeToken: async () => false })
    const response = await handleBoards(
      new Request('http://local/api/boards', { headers: { authorization: 'Bearer good' } }),
      store,
    )
    expect(response.status).toBe(429)
    expect(store.writes).toEqual([])
  })
})
