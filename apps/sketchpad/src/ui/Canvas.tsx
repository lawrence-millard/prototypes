import type { PointerEvent as ReactPointerEvent } from 'react'
import { CANVAS, CANVAS_SIZE, HALO, INK } from '../model/constants'
import { centerOf, connectorSegment, handleAt, wrapLabel } from '../model/geometry'
import { topShapeAt } from '../model/board'
import type { Board, Handle, Point, Shape, Tool } from '../model/types'

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const matrix = svg.getScreenCTM()
  if (!matrix) return { x: 0, y: 0 }
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
  return { x: point.x, y: point.y }
}

function cursorFor(tool: Tool, board: Board, selection: string | null, point: Point): string {
  if (tool !== 'select') return 'crosshair'
  const selected = selection ? board.shapes.find((shape) => shape.id === selection) : undefined
  const handle = selected ? handleAt(selected, point) : null
  if (handle === 'nw' || handle === 'se') return 'nwse-resize'
  if (handle === 'ne' || handle === 'sw') return 'nesw-resize'
  if (topShapeAt(board, point)) return 'move'
  return 'default'
}

export function Canvas({
  board,
  tool,
  selection,
  connectFrom,
  onPointerDownPoint,
  onPointerMovePoint,
  onPointerUpPoint,
}: {
  board: Board
  tool: Tool
  selection: string | null
  connectFrom: string | null
  onPointerDownPoint: (point: Point) => void
  onPointerMovePoint: (point: Point) => void
  onPointerUpPoint: () => void
}) {
  const selected = board.shapes.find((shape) => shape.id === selection)
  const label = [
    'Whiteboard.',
    `${tool} tool.`,
    `${board.shapes.length} shapes.`,
    selected
      ? `Selected ${selected.kind}${selected.text ? `, ${selected.text}` : ''}.`
      : 'Nothing selected.',
  ].join(' ')

  function pointFrom(event: ReactPointerEvent<SVGSVGElement>): Point {
    return clientToSvg(event.currentTarget, event.clientX, event.clientY)
  }

  return (
    <div className="canvas-wrap">
      <svg
        id="canvas"
        className="canvas"
        role="application"
        aria-label={label}
        tabIndex={0}
        width={CANVAS_SIZE.width}
        height={CANVAS_SIZE.height}
        viewBox={`0 0 ${CANVAS_SIZE.width} ${CANVAS_SIZE.height}`}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.currentTarget.setPointerCapture(event.pointerId)
          event.currentTarget.focus()
          onPointerDownPoint(pointFrom(event))
        }}
        onPointerMove={(event) => {
          const point = pointFrom(event)
          event.currentTarget.style.cursor = cursorFor(tool, board, selection, point)
          onPointerMovePoint(point)
        }}
        onPointerUp={() => onPointerUpPoint()}
        onLostPointerCapture={() => onPointerUpPoint()}
      >
        <rect width={CANVAS_SIZE.width} height={CANVAS_SIZE.height} fill={CANVAS} />
        <defs>
          <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#d4d4d4" />
          </pattern>
          <marker id="canvas-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={INK} />
          </marker>
        </defs>
        <rect width={CANVAS_SIZE.width} height={CANVAS_SIZE.height} fill="url(#dot-grid)" />
        {board.connectors.map((connector) => {
          const from = board.shapes.find((shape) => shape.id === connector.fromId)
          const to = board.shapes.find((shape) => shape.id === connector.toId)
          if (!from || !to) return null
          const segment = connectorSegment(from, to)
          return (
            <line
              key={connector.id}
              data-testid="connector"
              data-from={connector.fromId}
              data-to={connector.toId}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              stroke={INK}
              strokeWidth={2}
              markerEnd="url(#canvas-arrow)"
              pointerEvents="none"
            />
          )
        })}
        {board.shapes.map((shape) => (
          <ShapeGraphic
            key={shape.id}
            shape={shape}
            selected={shape.id === selection}
            connecting={shape.id === connectFrom}
          />
        ))}
      </svg>
    </div>
  )
}

function ShapeGraphic({
  shape,
  selected,
  connecting,
}: {
  shape: Shape
  selected: boolean
  connecting: boolean
}) {
  return (
    <g data-shape-kind={shape.kind} data-shape-id={shape.id}>
      <ShapeBody shape={shape} />
      <ShapeLabel shape={shape} />
      {connecting ? (
        <rect
          x={shape.x - 5}
          y={shape.y - 5}
          width={shape.width + 10}
          height={shape.height + 10}
          fill="none"
          stroke="#0b0b0b"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      ) : null}
      {selected ? <SelectionHandles shape={shape} /> : null}
    </g>
  )
}

function ShapeBody({ shape }: { shape: Shape }) {
  if (shape.kind === 'ellipse') {
    return (
      <ellipse
        data-shape-body="true"
        cx={shape.x + shape.width / 2}
        cy={shape.y + shape.height / 2}
        rx={shape.width / 2}
        ry={shape.height / 2}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={2}
      />
    )
  }
  if (shape.kind === 'diamond') {
    const cx = shape.x + shape.width / 2
    const cy = shape.y + shape.height / 2
    const points = `${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${shape.y + shape.height} ${shape.x},${cy}`
    return <polygon data-shape-body="true" points={points} fill={shape.fill} stroke={shape.stroke} strokeWidth={2} />
  }
  return (
    <rect
      data-shape-body="true"
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      rx={shape.kind === 'text' ? 4 : 8}
      fill={shape.fill}
      stroke={shape.stroke}
      strokeWidth={2}
      strokeDasharray={shape.kind === 'text' ? '5 4' : undefined}
    />
  )
}

function ShapeLabel({ shape }: { shape: Shape }) {
  const lines = wrapLabel(shape.text, shape.width)
  if (lines.length === 0) return null
  const center = centerOf(shape)
  const lineHeight = 18
  const startDy = -((lines.length - 1) * lineHeight) / 2
  return (
    <text
      x={center.x}
      y={center.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="Segoe UI, Helvetica Neue, sans-serif"
      fontSize={15}
      fill={INK}
      stroke={HALO}
      strokeWidth={4}
      paintOrder="stroke"
    >
      {lines.map((line, index) => (
        <tspan key={`${index}-${line}`} x={center.x} dy={index === 0 ? startDy : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

function SelectionHandles({ shape }: { shape: Shape }) {
  const handles: Array<{ id: Handle; cx: number; cy: number }> = [
    { id: 'nw', cx: shape.x, cy: shape.y },
    { id: 'ne', cx: shape.x + shape.width, cy: shape.y },
    { id: 'sw', cx: shape.x, cy: shape.y + shape.height },
    { id: 'se', cx: shape.x + shape.width, cy: shape.y + shape.height },
  ]
  return (
    <>
      <rect
        x={shape.x - 4}
        y={shape.y - 4}
        width={shape.width + 8}
        height={shape.height + 8}
        fill="none"
        stroke="#0b0b0b"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      {handles.map((handle) => (
        <circle key={handle.id} data-handle={handle.id} cx={handle.cx} cy={handle.cy} r={5} fill="#f6f6f6" stroke="#0b0b0b" strokeWidth={2} />
      ))}
    </>
  )
}
