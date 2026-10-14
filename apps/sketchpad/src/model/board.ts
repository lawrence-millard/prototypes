import { MAX_NAME, MAX_TEXT, SHAPE_DEFAULTS } from './constants'
import { clampBounds, pointInShape } from './geometry'
import type { Board, Bounds, Connector, Point, Shape, ShapeKind } from './types'

export function createId(): string {
  return crypto.randomUUID()
}

function touch(board: Board, now = Date.now()): Board {
  return { ...board, updatedAt: now }
}

export function createBoard(name = 'Untitled board', now = Date.now()): Board {
  return {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    shapes: [],
    connectors: [],
    sample: false,
  }
}

export function shapeById(board: Board, id: string): Shape | undefined {
  return board.shapes.find((shape) => shape.id === id)
}

export function validateBoardName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Name is required.'
  if (trimmed.length > MAX_NAME) return `Name must be ${MAX_NAME} characters or fewer.`
  if (/[\u0000-\u001F]/.test(trimmed)) return 'Name has invalid characters.'
  return null
}

export function renameBoard(board: Board, name: string): { board: Board; error?: string } {
  const error = validateBoardName(name)
  if (error) return { board, error }
  const trimmed = name.trim()
  if (trimmed === board.name) return { board }
  return { board: touch({ ...board, name: trimmed }) }
}

export interface NewShape {
  id?: string
  kind: ShapeKind
  x: number
  y: number
  width: number
  height: number
  text?: string
  fill?: string
  stroke?: string
}

export function addShape(board: Board, input: NewShape): Board {
  const defaults = SHAPE_DEFAULTS[input.kind]
  const bounds = clampBounds({
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
  })
  const shape: Shape = {
    id: input.id ?? createId(),
    kind: input.kind,
    ...bounds,
    text: (input.text ?? '').slice(0, MAX_TEXT),
    fill: input.fill ?? defaults.fill,
    stroke: input.stroke ?? defaults.stroke,
  }
  return touch({ ...board, shapes: [...board.shapes, shape] })
}

export function moveShape(board: Board, id: string, dx: number, dy: number): Board {
  if (dx === 0 && dy === 0) return board
  let changed = false
  const shapes = board.shapes.map((shape) => {
    if (shape.id !== id) return shape
    const bounds = clampBounds({
      x: shape.x + dx,
      y: shape.y + dy,
      width: shape.width,
      height: shape.height,
    })
    if (bounds.x === shape.x && bounds.y === shape.y) return shape
    changed = true
    return { ...shape, ...bounds }
  })
  if (!changed) return board
  return touch({ ...board, shapes })
}

export function updateShapeBounds(board: Board, id: string, bounds: Bounds): Board {
  const next = clampBounds(bounds)
  let changed = false
  const shapes = board.shapes.map((shape) => {
    if (shape.id !== id) return shape
    if (
      shape.x === next.x &&
      shape.y === next.y &&
      shape.width === next.width &&
      shape.height === next.height
    ) {
      return shape
    }
    changed = true
    return { ...shape, ...next }
  })
  if (!changed) return board
  return touch({ ...board, shapes })
}

export function resizeShapeBy(board: Board, id: string, dw: number, dh: number): Board {
  const shape = shapeById(board, id)
  if (!shape || (dw === 0 && dh === 0)) return board
  return updateShapeBounds(board, id, {
    x: shape.x,
    y: shape.y,
    width: shape.width + dw,
    height: shape.height + dh,
  })
}

export function updateShapeText(board: Board, id: string, text: string): Board {
  const clipped = text.slice(0, MAX_TEXT)
  let changed = false
  const shapes = board.shapes.map((shape) => {
    if (shape.id !== id || shape.text === clipped) return shape
    changed = true
    return { ...shape, text: clipped }
  })
  if (!changed) return board
  return touch({ ...board, shapes })
}

export function updateShapeFill(board: Board, id: string, fill: string): Board {
  let changed = false
  const shapes = board.shapes.map((shape) => {
    if (shape.id !== id || shape.fill === fill) return shape
    changed = true
    return { ...shape, fill }
  })
  if (!changed) return board
  return touch({ ...board, shapes })
}

export function deleteShape(board: Board, id: string): Board {
  if (!shapeById(board, id)) return board
  return touch({
    ...board,
    shapes: board.shapes.filter((shape) => shape.id !== id),
    connectors: board.connectors.filter((connector) => connector.fromId !== id && connector.toId !== id),
  })
}

export function connectShapes(
  board: Board,
  fromId: string,
  toId: string,
): { board: Board; error?: string } {
  if (fromId === toId) return { board, error: 'Choose two different shapes.' }
  if (!shapeById(board, fromId) || !shapeById(board, toId)) {
    return { board, error: 'Choose two shapes on this board.' }
  }
  const exists = board.connectors.some(
    (connector) =>
      (connector.fromId === fromId && connector.toId === toId) ||
      (connector.fromId === toId && connector.toId === fromId),
  )
  if (exists) return { board, error: 'Those shapes are already connected.' }
  const connector: Connector = { id: createId(), fromId, toId }
  return { board: touch({ ...board, connectors: [...board.connectors, connector] }) }
}

export function topShapeAt(board: Board, point: Point): Shape | null {
  for (let index = board.shapes.length - 1; index >= 0; index -= 1) {
    const shape = board.shapes[index]
    if (shape && pointInShape(shape, point)) return shape
  }
  return null
}
