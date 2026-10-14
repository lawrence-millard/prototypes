import { createSampleBoard } from '../model/sample'
import type { Board } from '../model/types'

export const DB_NAME = 'sketchpad'
export const DB_VERSION = 2

interface BoardRecord {
  key: string
  ownerId: string
  board: Board
}

interface MetaRecord {
  key: string
  seeded: boolean
}

interface TombstoneRecord {
  key: string
  ownerId: string
  boardId: string
  updatedAt: number
}

type LocalWrite = (ownerId: string, boardId: string, kind: 'upsert' | 'delete') => void

const tombstones = new Set<string>()
let afterWrite: LocalWrite | null = null

export function setAfterWrite(listener: LocalWrite | null): void {
  afterWrite = listener
}
const inflight = new Map<string, Promise<Board[]>>()
let dbPromise: Promise<IDBDatabase> | null = null

export function storageKey(ownerId: string, boardId: string): string {
  return `${encodeURIComponent(ownerId)}/${encodeURIComponent(boardId)}`
}

function seedKey(ownerId: string): string {
  return `${encodeURIComponent(ownerId)}/seeded`
}

function storageError(err: unknown, action: string): Error {
  if (err instanceof DOMException && err.name === 'QuotaExceededError') {
    return new Error('Could not save the board in this browser. Storage is full.')
  }
  if (err instanceof Error && err.message.startsWith('Could not')) return err
  return new Error(`Could not ${action} boards in this browser. Storage may be blocked.`)
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      dbPromise = null
      reject(new Error('Could not open the local database. This browser has storage disabled.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('boards')) {
        const boards = db.createObjectStore('boards', { keyPath: 'key' })
        boards.createIndex('byOwner', 'ownerId', { unique: false })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains('tombstones')) {
        const records = db.createObjectStore('tombstones', { keyPath: 'key' })
        records.createIndex('byOwner', 'ownerId', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(new Error('Could not open the local database. Storage may be blocked.'))
    }
  })
  return dbPromise
}

function readAll<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not read the local database.'))
  })
}

function isBoard(value: unknown): value is Board {
  if (typeof value !== 'object' || value === null) return false
  const board = value as Board
  return (
    typeof board.id === 'string' &&
    typeof board.name === 'string' &&
    Array.isArray(board.shapes) &&
    Array.isArray(board.connectors)
  )
}

function coerceBoard(board: Board): Board {
  return {
    ...board,
    sample: board.sample === true,
    createdAt: typeof board.createdAt === 'number' ? board.createdAt : Date.now(),
    updatedAt: typeof board.updatedAt === 'number' ? board.updatedAt : Date.now(),
  }
}

export async function listBoards(ownerId: string): Promise<Board[]> {
  try {
    const db = await openDb()
    const records = (await readAll(
      db.transaction('boards', 'readonly').objectStore('boards').index('byOwner').getAll(ownerId),
    )) as BoardRecord[]
    return records
      .map((record) => record.board)
      .filter(isBoard)
      .map(coerceBoard)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (err) {
    throw storageError(err, 'list')
  }
}

export async function getBoard(ownerId: string, boardId: string): Promise<Board | null> {
  try {
    const db = await openDb()
    const record = await readAll<BoardRecord | undefined>(
      db.transaction('boards', 'readonly').objectStore('boards').get(storageKey(ownerId, boardId)),
    )
    if (!record || !isBoard(record.board)) return null
    return structuredClone(coerceBoard(record.board))
  } catch (err) {
    throw storageError(err, 'open')
  }
}

export async function putBoard(
  ownerId: string,
  board: Board,
  mode: 'save' | 'restore' = 'save',
  sync = true,
): Promise<void> {
  const key = storageKey(ownerId, board.id)
  if (mode === 'restore') {
    tombstones.delete(key)
    await deleteTombstoneRow(key)
  } else if (tombstones.has(key)) return
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('boards', 'readwrite')
      tx.objectStore('boards').put({
        key,
        ownerId,
        board: structuredClone(board),
      } satisfies BoardRecord)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    if (tombstones.has(key)) {
      await deleteRecord(key)
    } else if (sync) {
      afterWrite?.(ownerId, board.id, 'upsert')
    }
  } catch (err) {
    throw storageError(err, 'save')
  }
}

async function deleteRecord(key: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('boards', 'readwrite')
    tx.objectStore('boards').delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function deleteBoard(ownerId: string, boardId: string): Promise<void> {
  const key = storageKey(ownerId, boardId)
  tombstones.add(key)
  try {
    await writeTombstone(ownerId, boardId, Date.now())
    await deleteRecord(key)
    afterWrite?.(ownerId, boardId, 'delete')
  } catch (err) {
    throw storageError(err, 'delete')
  }
}

export async function removeBoardRecord(ownerId: string, boardId: string): Promise<void> {
  await deleteRecord(storageKey(ownerId, boardId))
}

export async function listTombstones(ownerId: string): Promise<Array<{ id: string; updatedAt: number }>> {
  const db = await openDb()
  const records = (await readAll(
    db.transaction('tombstones', 'readonly').objectStore('tombstones').index('byOwner').getAll(ownerId),
  )) as TombstoneRecord[]
  return records.map((record) => ({ id: record.boardId, updatedAt: record.updatedAt }))
}

export async function clearTombstone(ownerId: string, boardId: string): Promise<void> {
  const key = storageKey(ownerId, boardId)
  tombstones.delete(key)
  await deleteTombstoneRow(key)
}

async function writeTombstone(ownerId: string, boardId: string, updatedAt: number): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('tombstones', 'readwrite')
    tx.objectStore('tombstones').put({
      key: storageKey(ownerId, boardId),
      ownerId,
      boardId,
      updatedAt,
    } satisfies TombstoneRecord)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function deleteTombstoneRow(key: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('tombstones', 'readwrite')
    tx.objectStore('tombstones').delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function isSeeded(ownerId: string): Promise<boolean> {
  const db = await openDb()
  const record = await readAll<MetaRecord | undefined>(
    db.transaction('meta', 'readonly').objectStore('meta').get(seedKey(ownerId)),
  )
  return record?.seeded === true
}

async function markSeeded(ownerId: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite')
    tx.objectStore('meta').put({ key: seedKey(ownerId), seeded: true } satisfies MetaRecord)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function loadLibraryInner(ownerId: string): Promise<Board[]> {
  const seeded = await isSeeded(ownerId)
  let boards = await listBoards(ownerId)
  if (!seeded) {
    if (boards.length === 0) {
      const sample = createSampleBoard()
      await putBoard(ownerId, sample)
      boards = [sample]
    }
    await markSeeded(ownerId)
  }
  return boards.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function loadLibrary(ownerId: string): Promise<Board[]> {
  const existing = inflight.get(ownerId)
  if (existing) return existing
  const promise = loadLibraryInner(ownerId).finally(() => {
    if (inflight.get(ownerId) === promise) inflight.delete(ownerId)
  })
  inflight.set(ownerId, promise)
  return promise.catch((err: unknown) => {
    throw storageError(err, 'list')
  })
}

export async function deleteSampleBoards(ownerId: string): Promise<number> {
  const boards = await listBoards(ownerId)
  const samples = boards.filter((board) => board.sample)
  for (const board of samples) {
    await deleteBoard(ownerId, board.id)
  }
  await markSeeded(ownerId)
  return samples.length
}

export async function resetDbConnectionForTests(): Promise<void> {
  inflight.clear()
  tombstones.clear()
  if (dbPromise) {
    try {
      const db = await dbPromise
      db.close()
    } catch {
      return
    }
  }
  dbPromise = null
}
