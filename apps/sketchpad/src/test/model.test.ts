import { describe, expect, it } from 'vitest'
import { clerkPublishableKey, isPlausibleClerkPublishableKey } from '../auth/config'
import { addShape, connectShapes, createBoard, moveShape, renameBoard, shapeById } from '../model/board'
import {
  connectorSegment,
  pointOnEllipseBoundary,
  pointOnRectBoundary,
  resizeFromHandle,
} from '../model/geometry'
import { commitHistory, createHistory, redoHistory, undoHistory } from '../model/history'
import { renderBoardSvg } from '../model/svg'
import { exportBoardJson, importBoardJson } from '../model/transfer'
import type { Board } from '../model/types'

function twoShapes(): Board {
  let board = createBoard('Notes')
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
  return board
}

describe('board model', () => {
  it('keeps a connector on the shape edges after a move and an undo', () => {
    const board = twoShapes()
    const connected = connectShapes(board, 'a', 'b')
    expect(connected.error).toBeUndefined()
    const before = connectorSegment(shapeById(connected.board, 'a')!, shapeById(connected.board, 'b')!)
    expect(pointOnRectBoundary(shapeById(connected.board, 'a')!, { x: before.x1, y: before.y1 })).toBe(true)
    expect(pointOnEllipseBoundary(shapeById(connected.board, 'b')!, { x: before.x2, y: before.y2 })).toBe(true)

    const moved = moveShape(connected.board, 'a', 50, 30)
    const after = connectorSegment(shapeById(moved, 'a')!, shapeById(moved, 'b')!)
    expect(after.x1).not.toBeCloseTo(before.x1)
    expect(pointOnRectBoundary(shapeById(moved, 'a')!, { x: after.x1, y: after.y1 })).toBe(true)
    expect(pointOnEllipseBoundary(shapeById(moved, 'b')!, { x: after.x2, y: after.y2 })).toBe(true)
    expect(moved.connectors[0]?.fromId).toBe('a')
    expect(moved.connectors[0]?.toId).toBe('b')

    const undone = undoHistory(commitHistory(createHistory(connected.board), moved))
    expect(shapeById(undone.present, 'a')?.x).toBe(40)
    const restored = connectorSegment(shapeById(undone.present, 'a')!, shapeById(undone.present, 'b')!)
    expect(restored.x1).toBeCloseTo(before.x1)
    expect(restored.y1).toBeCloseTo(before.y1)
    const redone = redoHistory(undone)
    expect(shapeById(redone.present, 'a')?.x).toBe(90)
  })

  it('resizes from the south-east handle without detaching the connector', () => {
    const connected = connectShapes(twoShapes(), 'a', 'b')
    const shape = shapeById(connected.board, 'a')!
    const resized = resizeFromHandle(shape, 'se', 40, 20)
    expect(resized.width).toBe(160)
    expect(resized.height).toBe(100)
    expect(resized.x).toBe(shape.x)
  })

  it('rejects an empty board name and a connector to the same shape', () => {
    const board = twoShapes()
    expect(renameBoard(board, '   ').error).toBe('Name is required.')
    expect(connectShapes(board, 'a', 'a').error).toBe('Choose two different shapes.')
  })

  it('renders labels and an arrow in SVG', () => {
    const connected = connectShapes(twoShapes(), 'a', 'b')
    const rendered = renderBoardSvg(connected.board)
    expect(rendered.svg).toContain('Start')
    expect(rendered.svg).toContain('End')
    expect(rendered.svg).toContain('<line ')
    expect(rendered.svg).not.toContain('"sample"')
  })
})

describe('import validation', () => {
  function fileFor(board: Board): Record<string, unknown> {
    return JSON.parse(exportBoardJson(board)) as Record<string, unknown>
  }

  it('rejects untrusted files without echoing their contents', () => {
    const board = twoShapes()
    const secret = 'super-secret-token-value'
    const cases: Array<{ body: string; error: RegExp }> = [
      { body: '[]', error: /not a Sketchpad board/ },
      { body: '{', error: /not a Sketchpad board/ },
      { body: 'x'.repeat(1_000_001), error: /larger than 1 MB/ },
    ]
    for (const item of cases) {
      const result = importBoardJson(item.body)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(item.error)
    }

    const extra = fileFor(board)
    extra.note = secret
    const extraResult = importBoardJson(JSON.stringify(extra))
    expect(extraResult.ok).toBe(false)
    if (!extraResult.ok) {
      expect(extraResult.error).toBe('This file has an unsupported field.')
      expect(extraResult.error).not.toContain(secret)
    }

    const proto = `{"format":"sketchpad-board","version":1,"__proto__":{"polluted":true},"board":{"name":"N","shapes":[],"connectors":[]}}`
    expect(importBoardJson(proto).ok).toBe(false)
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()

    const version = fileFor(board)
    version.version = 2
    expect(importBoardJson(JSON.stringify(version)).ok).toBe(false)

    const locked = fileFor(connectShapes(board, 'a', 'b').board) as {
      board: { shapes: Array<Record<string, unknown>>; connectors: Array<Record<string, unknown>> }
    }
    locked.board.shapes[0]!.locked = true
    expect(importBoardJson(JSON.stringify(locked)).ok).toBe(false)

    const kind = fileFor(board) as { board: { shapes: Array<Record<string, unknown>> } }
    kind.board.shapes[0]!.kind = 'line'
    expect(importBoardJson(JSON.stringify(kind)).ok).toBe(false)

    const huge = fileFor(board) as { board: { shapes: Array<Record<string, unknown>> } }
    huge.board.shapes[0]!.width = 9000
    expect(importBoardJson(JSON.stringify(huge)).ok).toBe(false)

    const color = fileFor(board) as { board: { shapes: Array<Record<string, unknown>> } }
    color.board.shapes[0]!.fill = 'red'
    expect(importBoardJson(JSON.stringify(color)).ok).toBe(false)

    const missing = fileFor(connectShapes(board, 'a', 'b').board) as {
      board: { connectors: Array<Record<string, unknown>> }
    }
    missing.board.connectors[0]!.toId = 'missing-shape'
    const missingResult = importBoardJson(JSON.stringify(missing))
    expect(missingResult.ok).toBe(false)
    if (!missingResult.ok) expect(missingResult.error).toBe('A connector points at a missing shape.')
  })
})

describe('optional Clerk key', () => {
  it('treats a blank key as local mode and accepts only a publishable key', () => {
    expect(clerkPublishableKey(undefined)).toBeNull()
    expect(clerkPublishableKey('')).toBeNull()
    expect(clerkPublishableKey('   ')).toBeNull()
    expect(isPlausibleClerkPublishableKey('pk_test_')).toBe(false)
    expect(isPlausibleClerkPublishableKey(`pk_test_${'a'.repeat(20)}`)).toBe(true)
    expect(isPlausibleClerkPublishableKey(`sk_test_${'a'.repeat(20)}`)).toBe(false)
    expect(isPlausibleClerkPublishableKey(clerkPublishableKey(`  pk_live_${'b'.repeat(24)}  `) ?? '')).toBe(true)
  })
})
