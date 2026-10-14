import { describe, expect, it } from 'vitest'
import type { Board } from '../model/types'
import type { RemoteBoard } from './contract'
import { mergeLibraries } from './merge'

function board(id: string, updatedAt: number, name = id): Board {
  return {
    id,
    name,
    createdAt: 1,
    updatedAt,
    shapes: [],
    connectors: [],
    sample: false,
  }
}

function remote(id: string, updatedAt: number, deletedAt: number | null = null, name = id): RemoteBoard {
  return { ...board(id, updatedAt, name), deletedAt }
}

describe('mergeLibraries', () => {
  it('keeps the newer copy and pushes only local winners', () => {
    const merged = mergeLibraries(
      [board('a', 10, 'local'), board('b', 30, 'mine')],
      [remote('a', 20, null, 'remote'), remote('b', 10, null, 'old')],
      [],
    )
    expect(merged.boards.map((item) => item.name).sort()).toEqual(['mine', 'remote'])
    expect(merged.upserts.map((item) => item.id)).toEqual(['b'])
    expect(merged.deletes).toEqual([])
  })

  it('lets a newer local delete win and a newer remote delete drop the board', () => {
    const merged = mergeLibraries(
      [board('keep', 5), board('gone', 4)],
      [remote('keep', 9, 9), remote('gone', 2)],
      [
        { id: 'gone', updatedAt: 8 },
        { id: 'keep', updatedAt: 3 },
      ],
    )
    expect(merged.boards.map((item) => item.id)).toEqual([])
    expect(merged.deletes).toEqual([{ id: 'gone', updatedAt: 8 }])
    expect(merged.dropTombstones).toContain('keep')
  })

  it('does not push when timestamps match', () => {
    const merged = mergeLibraries([board('a', 5, 'local')], [remote('a', 5, null, 'remote')], [])
    expect(merged.boards[0]?.name).toBe('local')
    expect(merged.upserts).toEqual([])
  })

  it('pushes a delete that ties with remote content', () => {
    const merged = mergeLibraries([board('a', 5)], [remote('a', 5)], [{ id: 'a', updatedAt: 5 }])
    expect(merged.boards).toEqual([])
    expect(merged.deletes).toEqual([{ id: 'a', updatedAt: 5 }])
  })
})
