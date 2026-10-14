import {
  clearTombstone,
  getBoard,
  listBoards,
  listTombstones,
  putBoard,
  removeBoardRecord,
  setAfterWrite,
} from '../db/database'
import type { Board } from '../model/types'
import { remoteResponseSchema, type RemoteBoard } from './contract'
import { mergeLibraries, type Tombstone } from './merge'

const PUSH_MS = 1200
const CHUNK = 25

type TokenSource = () => Promise<string | null>
type Dirty = { ownerId: string; id: string; kind: 'upsert' | 'delete' }

let tokenSource: TokenSource | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let queuedOwner: string | null = null
let lastOwner: string | null = null
let chain: Promise<void> = Promise.resolve()
let onlineBound = false
const dirty = new Map<string, Dirty>()

export type SyncPhase = 'local' | 'syncing' | 'synced' | 'offline'

let phase: SyncPhase = 'local'
const phaseListeners = new Set<() => void>()

function setPhase(next: SyncPhase): void {
  phase = next
  for (const listener of phaseListeners) listener()
}

export function subscribeSync(listener: () => void): () => void {
  phaseListeners.add(listener)
  return () => phaseListeners.delete(listener)
}

export function getSyncPhase(): SyncPhase {
  return tokenSource ? phase : 'local'
}

export function bindSync(source: TokenSource | null): void {
  tokenSource = source
  setAfterWrite(source ? noteLocalWrite : null)
  if (!source) setPhase('local')
  if (source && !onlineBound && typeof window !== 'undefined') {
    onlineBound = true
    window.addEventListener('online', () => {
      if (lastOwner) void syncOnLoad(lastOwner)
    })
  }
}

export function queueSync(ownerId: string): void {
  if (!tokenSource) return
  setPhase('syncing')
  queuedOwner = ownerId
  lastOwner = ownerId
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    const ownerId = queuedOwner
    queuedOwner = null
    if (ownerId) void enqueue(() => pushDirty(ownerId))
  }, PUSH_MS)
}

export async function syncOnLoad(ownerId: string): Promise<void> {
  if (!tokenSource) return
  setPhase('syncing')
  lastOwner = ownerId
  await enqueue(() => pullAndPush(ownerId))
}

function noteLocalWrite(ownerId: string, boardId: string, kind: 'upsert' | 'delete'): void {
  dirty.set(`${ownerId}/${boardId}`, { ownerId, id: boardId, kind })
  queueSync(ownerId)
}

function enqueue(job: () => Promise<void>): Promise<void> {
  const run = chain.then(job, job)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function pullAndPush(ownerId: string): Promise<void> {
  const token = await tokenSource?.()
  if (!token) {
    setPhase('offline')
    return
  }
  let remote: RemoteBoard[]
  try {
    remote = await getRemote(token)
  } catch {
    setPhase('offline')
    return
  }
  const merged = mergeLibraries(await listBoards(ownerId), remote, await listTombstones(ownerId))
  await applyMerged(ownerId, merged.boards)
  for (const id of merged.dropTombstones) await clearTombstone(ownerId, id)
  if (merged.upserts.length === 0 && merged.deletes.length === 0) {
    clearDirty(ownerId)
    setPhase('synced')
    return
  }
  try {
    await sendChanges(token, merged.upserts, merged.deletes)
    for (const tomb of merged.deletes) await clearTombstone(ownerId, tomb.id)
    clearDirty(ownerId)
    setPhase('synced')
  } catch {
    for (const board of merged.upserts) dirty.set(`${ownerId}/${board.id}`, { ownerId, id: board.id, kind: 'upsert' })
    for (const tomb of merged.deletes) dirty.set(`${ownerId}/${tomb.id}`, { ownerId, id: tomb.id, kind: 'delete' })
    setPhase('offline')
  }
}

async function pushDirty(ownerId: string): Promise<void> {
  const token = await tokenSource?.()
  if (!token) {
    setPhase('offline')
    return
  }
  const pending = [...dirty.values()].filter((item) => item.ownerId === ownerId)
  if (pending.length === 0) {
    setPhase('synced')
    return
  }
  const boards: Board[] = []
  const deletes: Tombstone[] = []
  const tombs = await listTombstones(ownerId)
  for (const item of pending) {
    if (item.kind === 'delete') {
      const tomb = tombs.find((entry) => entry.id === item.id)
      deletes.push({ id: item.id, updatedAt: tomb?.updatedAt ?? Date.now() })
    } else {
      const board = await getBoard(ownerId, item.id)
      if (board) boards.push(board)
    }
  }
  try {
    await sendChanges(token, boards, deletes)
    for (const item of pending) {
      const current = dirty.get(`${ownerId}/${item.id}`)
      if (current && current.kind === item.kind) dirty.delete(`${ownerId}/${item.id}`)
    }
    for (const tomb of deletes) await clearTombstone(ownerId, tomb.id)
    setPhase('synced')
  } catch {
    setPhase('offline')
  }
}

async function applyMerged(ownerId: string, boards: Board[]): Promise<void> {
  const keep = new Set(boards.map((board) => board.id))
  for (const board of await listBoards(ownerId)) {
    if (!keep.has(board.id)) await removeBoardRecord(ownerId, board.id)
  }
  for (const board of boards) await putBoard(ownerId, board, 'restore', false)
}

async function sendChanges(token: string, boards: Board[], deletes: Tombstone[]): Promise<void> {
  const changes = [
    ...boards.map((board) => ({
      id: board.id,
      name: board.name,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      sample: board.sample,
      shapes: board.shapes,
      connectors: board.connectors,
    })),
    ...deletes.map((tomb) => ({
      id: tomb.id,
      name: 'Deleted',
      createdAt: tomb.updatedAt,
      updatedAt: tomb.updatedAt,
      deleted: true,
    })),
  ]
  for (let index = 0; index < changes.length; index += CHUNK) {
    const response = await fetch('/api/boards', {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ changes: changes.slice(index, index + CHUNK) }),
    })
    if (!response.ok) throw new Error('sync')
  }
}

async function getRemote(token: string): Promise<RemoteBoard[]> {
  const response = await fetch('/api/boards', {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  })
  if (!response.ok) throw new Error('sync')
  const parsed = remoteResponseSchema.safeParse(await response.json())
  if (!parsed.success) throw new Error('sync')
  return parsed.data.boards
}

function clearDirty(ownerId: string): void {
  for (const [key, value] of dirty) {
    if (value.ownerId === ownerId) dirty.delete(key)
  }
}
