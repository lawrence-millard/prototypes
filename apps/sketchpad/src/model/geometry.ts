import { MAX_COORD, MAX_SHAPE, MIN_COORD, MIN_SHAPE } from './constants'
import type { Bounds, Handle, Point, Shape } from './types'

export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function centerOf(shape: Shape): Point {
  return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 }
}

export function pointInShape(shape: Shape, point: Point): boolean {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  if (shape.kind === 'ellipse') {
    const rx = shape.width / 2
    const ry = shape.height / 2
    if (rx <= 0 || ry <= 0) return false
    const dx = (point.x - cx) / rx
    const dy = (point.y - cy) / ry
    return dx * dx + dy * dy <= 1
  }
  if (shape.kind === 'diamond') {
    const hw = shape.width / 2
    const hh = shape.height / 2
    if (hw <= 0 || hh <= 0) return false
    return Math.abs(point.x - cx) / hw + Math.abs(point.y - cy) / hh <= 1
  }
  return (
    point.x >= shape.x &&
    point.y >= shape.y &&
    point.x <= shape.x + shape.width &&
    point.y <= shape.y + shape.height
  )
}

export function edgePoint(shape: Shape, toward: Point): Point {
  const c = centerOf(shape)
  const dx = toward.x - c.x
  const dy = toward.y - c.y
  const hw = shape.width / 2
  const hh = shape.height / 2
  if (hw <= 0 || hh <= 0) return c
  if (dx === 0 && dy === 0) return { x: c.x + hw, y: c.y }

  if (shape.kind === 'ellipse') {
    const denom = Math.sqrt((dx * dx) / (hw * hw) + (dy * dy) / (hh * hh))
    return { x: c.x + dx / denom, y: c.y + dy / denom }
  }
  if (shape.kind === 'diamond') {
    const scale = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh)
    return { x: c.x + dx * scale, y: c.y + dy * scale }
  }
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh)
  return { x: c.x + dx * scale, y: c.y + dy * scale }
}

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function connectorSegment(from: Shape, to: Shape): Segment {
  const start = edgePoint(from, centerOf(to))
  const end = edgePoint(to, centerOf(from))
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y }
}

export function pointOnRectBoundary(shape: Shape, point: Point, epsilon = 0.75): boolean {
  const left = Math.abs(point.x - shape.x) <= epsilon
  const right = Math.abs(point.x - (shape.x + shape.width)) <= epsilon
  const top = Math.abs(point.y - shape.y) <= epsilon
  const bottom = Math.abs(point.y - (shape.y + shape.height)) <= epsilon
  const inX = point.x >= shape.x - epsilon && point.x <= shape.x + shape.width + epsilon
  const inY = point.y >= shape.y - epsilon && point.y <= shape.y + shape.height + epsilon
  return inX && inY && (left || right || top || bottom)
}

export function pointOnEllipseBoundary(shape: Shape, point: Point, epsilon = 0.03): boolean {
  const rx = shape.width / 2
  const ry = shape.height / 2
  if (rx <= 0 || ry <= 0) return false
  const dx = (point.x - (shape.x + rx)) / rx
  const dy = (point.y - (shape.y + ry)) / ry
  return Math.abs(dx * dx + dy * dy - 1) <= epsilon
}

export function pointOnDiamondBoundary(shape: Shape, point: Point, epsilon = 0.03): boolean {
  const hw = shape.width / 2
  const hh = shape.height / 2
  if (hw <= 0 || hh <= 0) return false
  const cx = shape.x + hw
  const cy = shape.y + hh
  const sum = Math.abs(point.x - cx) / hw + Math.abs(point.y - cy) / hh
  return Math.abs(sum - 1) <= epsilon
}

export function handleAt(shape: Shape, point: Point, radius = 12): Handle | null {
  const corners: Array<{ handle: Handle; x: number; y: number }> = [
    { handle: 'nw', x: shape.x, y: shape.y },
    { handle: 'ne', x: shape.x + shape.width, y: shape.y },
    { handle: 'sw', x: shape.x, y: shape.y + shape.height },
    { handle: 'se', x: shape.x + shape.width, y: shape.y + shape.height },
  ]
  for (const corner of corners) {
    if (Math.hypot(corner.x - point.x, corner.y - point.y) <= radius) return corner.handle
  }
  return null
}

export function resizeFromHandle(start: Bounds, handle: Handle, dx: number, dy: number): Bounds {
  let { x, y, width, height } = start
  if (handle === 'se') {
    width = clamp(start.width + dx, MIN_SHAPE, MAX_SHAPE)
    height = clamp(start.height + dy, MIN_SHAPE, MAX_SHAPE)
  } else if (handle === 'sw') {
    width = clamp(start.width - dx, MIN_SHAPE, MAX_SHAPE)
    x = start.x + (start.width - width)
    height = clamp(start.height + dy, MIN_SHAPE, MAX_SHAPE)
  } else if (handle === 'ne') {
    width = clamp(start.width + dx, MIN_SHAPE, MAX_SHAPE)
    height = clamp(start.height - dy, MIN_SHAPE, MAX_SHAPE)
    y = start.y + (start.height - height)
  } else {
    width = clamp(start.width - dx, MIN_SHAPE, MAX_SHAPE)
    x = start.x + (start.width - width)
    height = clamp(start.height - dy, MIN_SHAPE, MAX_SHAPE)
    y = start.y + (start.height - height)
  }
  return clampBounds({ x, y, width, height })
}

export function clampBounds(bounds: Bounds): Bounds {
  const width = clamp(bounds.width, MIN_SHAPE, MAX_SHAPE)
  const height = clamp(bounds.height, MIN_SHAPE, MAX_SHAPE)
  const x = clamp(bounds.x, MIN_COORD, MAX_COORD - width)
  const y = clamp(bounds.y, MIN_COORD, MAX_COORD - height)
  return {
    x: roundCoord(x),
    y: roundCoord(y),
    width: roundCoord(width),
    height: roundCoord(height),
  }
}

export function wrapLabel(text: string, width: number): string[] {
  const maxChars = Math.max(4, Math.floor((width - 20) / 8))
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 5)
}
