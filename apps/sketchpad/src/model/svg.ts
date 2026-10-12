import { CANVAS, HALO, INK, PNG_MAX_EDGE } from './constants'
import { centerOf, connectorSegment, wrapLabel } from './geometry'
import type { Board, Shape } from './types'

export interface RenderedSvg {
  svg: string
  width: number
  height: number
}

export function boardBounds(board: Board): { x: number; y: number; width: number; height: number } {
  if (board.shapes.length === 0) return { x: 0, y: 0, width: 800, height: 600 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const shape of board.shapes) {
    minX = Math.min(minX, shape.x)
    minY = Math.min(minY, shape.y)
    maxX = Math.max(maxX, shape.x + shape.width)
    maxY = Math.max(maxY, shape.y + shape.height)
  }
  const pad = 40
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(1, maxX - minX + pad * 2),
    height: Math.max(1, maxY - minY + pad * 2),
  }
}

export function pngPixelSize(width: number, height: number, maxEdge = PNG_MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / width, maxEdge / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function renderBoardSvg(board: Board): RenderedSvg {
  const bounds = boardBounds(board)
  const shapes = new Map(board.shapes.map((shape) => [shape.id, shape]))
  const lines = board.connectors
    .map((connector) => {
      const from = shapes.get(connector.fromId)
      const to = shapes.get(connector.toId)
      if (!from || !to) return ''
      const segment = connectorSegment(from, to)
      return `<line x1="${n(segment.x1 - bounds.x)}" y1="${n(segment.y1 - bounds.y)}" x2="${n(segment.x2 - bounds.x)}" y2="${n(segment.y2 - bounds.y)}" stroke="${INK}" stroke-width="2" marker-end="url(#arrow)" />`
    })
    .join('')
  const shapeMarkup = board.shapes.map((shape) => renderShape(shape, bounds.x, bounds.y)).join('')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${n(bounds.width)}" height="${n(bounds.height)}" viewBox="0 0 ${n(bounds.width)} ${n(bounds.height)}">
  <rect width="100%" height="100%" fill="${CANVAS}" />
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${INK}" />
    </marker>
  </defs>
  ${lines}
  ${shapeMarkup}
</svg>`
  return { svg, width: bounds.width, height: bounds.height }
}

function renderShape(shape: Shape, originX: number, originY: number): string {
  const x = shape.x - originX
  const y = shape.y - originY
  const body = shapeBody(shape, x, y)
  const label = renderLabel(shape, x, y)
  return `${body}${label}`
}

function shapeBody(shape: Shape, x: number, y: number): string {
  const fill = escapeXml(shape.fill)
  const stroke = escapeXml(shape.stroke)
  if (shape.kind === 'ellipse') {
    return `<ellipse cx="${n(x + shape.width / 2)}" cy="${n(y + shape.height / 2)}" rx="${n(shape.width / 2)}" ry="${n(shape.height / 2)}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
  }
  if (shape.kind === 'diamond') {
    const cx = x + shape.width / 2
    const cy = y + shape.height / 2
    const points = `${n(cx)},${n(y)} ${n(x + shape.width)},${n(cy)} ${n(cx)},${n(y + shape.height)} ${n(x)},${n(cy)}`
    return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
  }
  const dash = shape.kind === 'text' ? ' stroke-dasharray="5 4"' : ''
  const radius = shape.kind === 'text' ? 4 : 8
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(shape.width)}" height="${n(shape.height)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"${dash} />`
}

function renderLabel(shape: Shape, x: number, y: number): string {
  const lines = wrapLabel(shape.text, shape.width)
  if (lines.length === 0) return ''
  const center = centerOf({ ...shape, x, y })
  const lineHeight = 18
  const startDy = -((lines.length - 1) * lineHeight) / 2
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? startDy : lineHeight
      return `<tspan x="${n(center.x)}" dy="${n(dy)}">${escapeXml(line)}</tspan>`
    })
    .join('')
  return `<text x="${n(center.x)}" y="${n(center.y)}" text-anchor="middle" font-family="Segoe UI, Helvetica Neue, sans-serif" font-size="15" fill="${INK}" stroke="${HALO}" stroke-width="4" paint-order="stroke">${tspans}</text>`
}

function n(value: number): string {
  return String(Math.round(value * 100) / 100)
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
