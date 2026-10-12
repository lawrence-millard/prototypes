import { createId } from './board'
import {
  MAX_CONNECTORS,
  MAX_COORD,
  MAX_IMPORT_CHARS,
  MAX_NAME,
  MAX_SHAPE,
  MAX_SHAPES,
  MAX_TEXT,
  MIN_COORD,
  MIN_SHAPE,
} from './constants'
import { BOARD_FORMAT, BOARD_VERSION, type Board, type Connector, type Shape, type ShapeKind } from './types'

const ROOT_KEYS = new Set(['format', 'version', 'exportedAt', 'board'])
const BOARD_KEYS = new Set(['name', 'shapes', 'connectors'])
const SHAPE_KEYS = new Set(['id', 'kind', 'x', 'y', 'width', 'height', 'text', 'fill', 'stroke'])
const CONNECTOR_KEYS = new Set(['id', 'fromId', 'toId'])
const KINDS = new Set<ShapeKind>(['rectangle', 'ellipse', 'diamond', 'text'])
const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

export type ImportResult = { ok: true; board: Board } | { ok: false; error: string }

export interface ImportOptions {
  now?: number
  id?: string
}

export function exportBoardJson(board: Board, now = new Date()): string {
  return JSON.stringify(
    {
      format: BOARD_FORMAT,
      version: BOARD_VERSION,
      exportedAt: now.toISOString(),
      board: {
        name: board.name,
        shapes: board.shapes.map((shape) => ({
          id: shape.id,
          kind: shape.kind,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          text: shape.text,
          fill: shape.fill,
          stroke: shape.stroke,
        })),
        connectors: board.connectors.map((connector) => ({
          id: connector.id,
          fromId: connector.fromId,
          toId: connector.toId,
        })),
      },
    },
    null,
    2,
  )
}

export function downloadName(name: string, extension: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'board'}.${extension}`
}

export function importBoardJson(text: string, options: ImportOptions = {}): ImportResult {
  if (text.length > MAX_IMPORT_CHARS) {
    return { ok: false, error: 'That file is larger than 1 MB.' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    return { ok: false, error: 'This file is not a Sketchpad board.' }
  }
  const validated = validateFile(parsed)
  if (!validated.ok) return validated
  const now = options.now ?? Date.now()
  return {
    ok: true,
    board: {
      id: options.id ?? createId(),
      name: validated.name,
      createdAt: now,
      updatedAt: now,
      shapes: validated.shapes,
      connectors: validated.connectors,
      sample: false,
    },
  }
}

type Failure = { ok: false; error: string }
type ValidFile = { ok: true; name: string; shapes: Shape[]; connectors: Connector[] }

function fail(error: string): Failure {
  return { ok: false, error }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

function hasOnlyKeys(record: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(record).every((key) => allowed.has(key))
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validateFile(value: unknown): ValidFile | Failure {
  if (!isRecord(value)) return fail('This file is not a Sketchpad board.')
  if (!hasOnlyKeys(value, ROOT_KEYS)) return fail('This file has an unsupported field.')
  if (value.format !== BOARD_FORMAT || value.version !== BOARD_VERSION) {
    return fail('This file is not a Sketchpad board.')
  }
  if ('exportedAt' in value) {
    if (typeof value.exportedAt !== 'string' || value.exportedAt.length > 40) {
      return fail('This file is not a Sketchpad board.')
    }
  }
  if (!isRecord(value.board)) return fail('This file is not a Sketchpad board.')
  if (!hasOnlyKeys(value.board, BOARD_KEYS)) return fail('This file has an unsupported field.')
  if (typeof value.board.name !== 'string') return fail('The board name is missing.')
  const name = value.board.name.trim()
  if (!name) return fail('The board name is missing.')
  if (name.length > MAX_NAME) return fail('The board name is too long.')
  if (name !== value.board.name || /[\u0000-\u001F]/.test(name)) {
    return fail('The board name is invalid.')
  }
  if (!Array.isArray(value.board.shapes) || !Array.isArray(value.board.connectors)) {
    return fail('This file is not a Sketchpad board.')
  }
  if (value.board.shapes.length > MAX_SHAPES) return fail('This file has too many shapes.')
  if (value.board.connectors.length > MAX_CONNECTORS) return fail('This file has too many connectors.')

  const shapes: Shape[] = []
  const shapeIds = new Set<string>()
  for (const entry of value.board.shapes) {
    const shape = validateShape(entry)
    if (!shape.ok) return shape
    if (shapeIds.has(shape.shape.id)) return fail('A shape in this file is invalid.')
    shapeIds.add(shape.shape.id)
    shapes.push(shape.shape)
  }

  const connectors: Connector[] = []
  const connectorIds = new Set<string>()
  const pairs = new Set<string>()
  for (const entry of value.board.connectors) {
    const connector = validateConnector(entry, shapeIds)
    if (!connector.ok) return connector
    if (connectorIds.has(connector.connector.id)) return fail('A connector in this file is invalid.')
    const pair = [connector.connector.fromId, connector.connector.toId].sort().join(':')
    if (pairs.has(pair)) return fail('A connector in this file is invalid.')
    connectorIds.add(connector.connector.id)
    pairs.add(pair)
    connectors.push(connector.connector)
  }

  return { ok: true, name, shapes, connectors }
}

function validateShape(value: unknown): { ok: true; shape: Shape } | Failure {
  if (!isRecord(value)) return fail('A shape in this file is invalid.')
  if (!hasOnlyKeys(value, SHAPE_KEYS)) return fail('This file has an unsupported field.')
  if (!isId(value.id)) return fail('A shape in this file is invalid.')
  if (typeof value.kind !== 'string' || !KINDS.has(value.kind as ShapeKind)) {
    return fail('A shape has an unsupported type.')
  }
  if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    return fail('A shape in this file is invalid.')
  }
  if (!isFiniteNumber(value.width) || !isFiniteNumber(value.height)) {
    return fail('A shape in this file is invalid.')
  }
  if (value.width < MIN_SHAPE || value.height < MIN_SHAPE) {
    return fail('A shape in this file is invalid.')
  }
  if (value.width > MAX_SHAPE || value.height > MAX_SHAPE) {
    return fail('A shape is larger than 4000 units.')
  }
  if (
    value.x < MIN_COORD ||
    value.y < MIN_COORD ||
    value.x + value.width > MAX_COORD ||
    value.y + value.height > MAX_COORD
  ) {
    return fail('A shape in this file is outside the supported area.')
  }
  if (typeof value.text !== 'string') return fail('A shape in this file is invalid.')
  if (value.text.length > MAX_TEXT) return fail('Shape text is too long.')
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value.text)) {
    return fail('A shape in this file is invalid.')
  }
  if (!isColor(value.fill) || !isColor(value.stroke)) {
    return fail('A shape color must be a 6-digit hex value.')
  }
  return {
    ok: true,
    shape: {
      id: value.id,
      kind: value.kind as ShapeKind,
      x: value.x,
      y: value.y,
      width: value.width,
      height: value.height,
      text: value.text,
      fill: value.fill,
      stroke: value.stroke,
    },
  }
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && COLOR_PATTERN.test(value)
}

function validateConnector(
  value: unknown,
  shapeIds: Set<string>,
): { ok: true; connector: Connector } | Failure {
  if (!isRecord(value)) return fail('A connector in this file is invalid.')
  if (!hasOnlyKeys(value, CONNECTOR_KEYS)) return fail('This file has an unsupported field.')
  if (!isId(value.id) || !isId(value.fromId) || !isId(value.toId)) {
    return fail('A connector in this file is invalid.')
  }
  if (value.fromId === value.toId) return fail('A connector in this file is invalid.')
  if (!shapeIds.has(value.fromId) || !shapeIds.has(value.toId)) {
    return fail('A connector points at a missing shape.')
  }
  return { ok: true, connector: { id: value.id, fromId: value.fromId, toId: value.toId } }
}
