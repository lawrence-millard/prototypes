import { describe, expect, it, vi } from 'vitest'
import { deleteBoard, deleteSampleBoards, getBoard, listBoards, loadLibrary, putBoard } from '../db/database'
import { createAutosave } from '../model/autosave'
import { addShape, connectShapes, createBoard, moveShape, shapeById } from '../model/board'
import { connectorSegment, pointOnEllipseBoundary, pointOnRectBoundary } from '../model/geometry'
import { createSampleBoard } from '../model/sample'
import { exportBoardJson, importBoardJson } from '../model/transfer'

describe('whiteboard workflow', () => {
  it('creates, connects, moves with the connector attached, autosaves, and round-trips JSON', async () => {
    let board = createBoard('Flow')
    board = addShape(board, {
      id: 'a',
      kind: 'rectangle',
      x: 40,
      y: 40,
      width: 120,
      height: 80,
      text: 'Start',
      fill: '#f3e6c8',
      stroke: '#1a1814',
    })
    board = addShape(board, {
      id: 'b',
      kind: 'ellipse',
      x: 320,
      y: 60,
      width: 140,
      height: 90,
      text: 'End',
      fill: '#d7ebe3',
      stroke: '#1a1814',
    })
    const connected = connectShapes(board, 'a', 'b')
    expect(connected.error).toBeUndefined()
    board = connected.board
    const before = connectorSegment(shapeById(board, 'a')!, shapeById(board, 'b')!)

    board = moveShape(board, 'a', 50, 30)
    const after = connectorSegment(shapeById(board, 'a')!, shapeById(board, 'b')!)
    expect(board.connectors).toHaveLength(1)
    expect(board.connectors[0]?.fromId).toBe('a')
    expect(board.connectors[0]?.toId).toBe('b')
    expect(after.x1).not.toBeCloseTo(before.x1)
    expect(pointOnRectBoundary(shapeById(board, 'a')!, { x: after.x1, y: after.y1 })).toBe(true)
    expect(pointOnEllipseBoundary(shapeById(board, 'b')!, { x: after.x2, y: after.y2 })).toBe(true)

    const autosave = createAutosave((next) => putBoard('local', next), 30)
    try {
      autosave.schedule(board)
      await vi.waitFor(async () => {
        const stored = await getBoard('local', board.id)
        expect(stored?.shapes.find((shape) => shape.id === 'a')?.x).toBe(shapeById(board, 'a')?.x)
        expect(stored?.connectors).toEqual(board.connectors)
      })
      expect(autosave.status()).toBe('saved')
    } finally {
      autosave.dispose()
    }

    const json = exportBoardJson(board)
    expect(json).not.toContain('"sample"')
    const imported = importBoardJson(json, { now: 10, id: 'imported-board' })
    expect(imported.ok).toBe(true)
    if (!imported.ok) return
    expect(imported.board.name).toBe('Flow')
    expect(imported.board.sample).toBe(false)
    expect(imported.board.id).toBe('imported-board')
    expect(imported.board.shapes).toEqual(board.shapes)
    expect(imported.board.connectors).toEqual(board.connectors)
    const roundTrip = connectorSegment(shapeById(imported.board, 'a')!, shapeById(imported.board, 'b')!)
    expect(roundTrip.x1).toBeCloseTo(after.x1)
    expect(roundTrip.y1).toBeCloseTo(after.y1)
  })

  it('keeps each owner in a separate IndexedDB namespace', async () => {
    await putBoard('user_a', createBoard('Mine'))
    await putBoard('user_b', createBoard('Theirs'))
    expect((await listBoards('user_a')).map((board) => board.name)).toEqual(['Mine'])
    expect(await listBoards('local')).toEqual([])
  })

  it('deletes labelled sample data once and does not recreate it', async () => {
    const first = await loadLibrary('local')
    expect(first.some((board) => board.sample)).toBe(true)
    expect(first[0]?.name.startsWith('Sample:')).toBe(true)
    expect(await deleteSampleBoards('local')).toBe(1)
    const second = await loadLibrary('local')
    expect(second.every((board) => !board.sample)).toBe(true)
  })

  it('does not let a late save restore a deleted board unless asked', async () => {
    const sample = createSampleBoard()
    await putBoard('local', sample)
    await deleteBoard('local', sample.id)
    await putBoard('local', sample)
    expect(await getBoard('local', sample.id)).toBeNull()
    await putBoard('local', sample, 'restore')
    expect((await getBoard('local', sample.id))?.sample).toBe(true)
  })

  it('reports a save failure without including the thrown details', async () => {
    const autosave = createAutosave(async () => {
      throw new Error('disk path /secret/board.json')
    }, 10)
    let message: string | null = null
    autosave.subscribe((_status, next) => {
      message = next
    })
    autosave.schedule(createBoard('X'))
    await expect(autosave.flush()).rejects.toThrow('Could not save the board in this browser.')
    expect(autosave.status()).toBe('error')
    expect(message ?? '').not.toContain('secret')
    autosave.dispose()
  })
})
