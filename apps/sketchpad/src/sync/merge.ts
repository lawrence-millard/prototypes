import type { Board } from '../model/types'
import type { RemoteBoard } from './contract'

export interface Tombstone {
  id: string
  updatedAt: number
}

export interface MergeResult {
  boards: Board[]
  upserts: Board[]
  deletes: Tombstone[]
  dropTombstones: string[]
}

type Present = { kind: 'board'; at: number; board: Board } | { kind: 'gone'; at: number }

function localState(board: Board | null, tombAt: number | null): Present | null {
  if (board && (tombAt === null || board.updatedAt > tombAt)) {
    return { kind: 'board', at: board.updatedAt, board }
  }
  if (tombAt !== null) return { kind: 'gone', at: tombAt }
  return null
}

function remoteState(remote: RemoteBoard | null): Present | null {
  if (!remote) return null
  if (remote.deletedAt != null) return { kind: 'gone', at: remote.updatedAt }
  return {
    kind: 'board',
    at: remote.updatedAt,
    board: {
      id: remote.id,
      name: remote.name,
      createdAt: remote.createdAt,
      updatedAt: remote.updatedAt,
      shapes: remote.shapes,
      connectors: remote.connectors,
      sample: remote.sample,
    },
  }
}

export function mergeLibraries(local: Board[], remote: RemoteBoard[], tombstones: Tombstone[]): MergeResult {
  const localById = new Map(local.map((board) => [board.id, board]))
  const remoteById = new Map(remote.map((board) => [board.id, board]))
  const tombById = new Map<string, number>()
  for (const tomb of tombstones) {
    const current = tombById.get(tomb.id)
    if (current === undefined || tomb.updatedAt > current) tombById.set(tomb.id, tomb.updatedAt)
  }
  const ids = new Set<string>([...localById.keys(), ...remoteById.keys(), ...tombById.keys()])
  const boards: Board[] = []
  const upserts: Board[] = []
  const deletes: Tombstone[] = []
  const dropTombstones: string[] = []

  for (const id of ids) {
    const tombAt = tombById.get(id) ?? null
    const localPresent = localState(localById.get(id) ?? null, tombAt)
    const remotePresent = remoteState(remoteById.get(id) ?? null)
    if (!localPresent && !remotePresent) continue
    if (localPresent && !remotePresent) {
      if (localPresent.kind === 'board') {
        boards.push(localPresent.board)
        upserts.push(localPresent.board)
      } else {
        deletes.push({ id, updatedAt: localPresent.at })
      }
      continue
    }
    if (!localPresent && remotePresent) {
      if (remotePresent.kind === 'board') boards.push(remotePresent.board)
      continue
    }
    if (!localPresent || !remotePresent) continue
    if (localPresent.at > remotePresent.at) {
      if (localPresent.kind === 'board') {
        boards.push(localPresent.board)
        upserts.push(localPresent.board)
      } else {
        deletes.push({ id, updatedAt: localPresent.at })
      }
      continue
    }
    if (remotePresent.at > localPresent.at) {
      if (remotePresent.kind === 'board') boards.push(remotePresent.board)
      if (tombAt !== null) dropTombstones.push(id)
      continue
    }
    if (localPresent.kind === 'gone' || remotePresent.kind === 'gone') {
      if (tombAt !== null) dropTombstones.push(id)
      if (localPresent.kind === 'gone' && remotePresent.kind === 'board') {
        deletes.push({ id, updatedAt: localPresent.at })
      }
      continue
    }
    boards.push(localPresent.board)
  }

  boards.sort((a, b) => b.updatedAt - a.updatedAt)
  return { boards, upserts, deletes, dropTombstones }
}
