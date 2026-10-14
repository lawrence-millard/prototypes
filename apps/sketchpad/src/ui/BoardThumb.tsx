import { connectorSegment } from '../model/geometry'
import type { Board, Shape } from '../model/types'

export function BoardThumb({ board }: { board: Board }) {
  if (board.shapes.length === 0) {
    return (
      <svg className="thumb" viewBox="0 0 160 96" aria-hidden="true">
        <rect width="160" height="96" fill="#f6f6f6" />
      </svg>
    )
  }
  const minX = Math.min(...board.shapes.map((shape) => shape.x))
  const minY = Math.min(...board.shapes.map((shape) => shape.y))
  const maxX = Math.max(...board.shapes.map((shape) => shape.x + shape.width))
  const maxY = Math.max(...board.shapes.map((shape) => shape.y + shape.height))
  const pad = 28
  const view = `${minX - pad} ${minY - pad} ${Math.max(1, maxX - minX) + pad * 2} ${Math.max(1, maxY - minY) + pad * 2}`
  return (
    <svg className="thumb" viewBox={view} aria-hidden="true">
      <rect x={minX - pad} y={minY - pad} width={maxX - minX + pad * 2} height={maxY - minY + pad * 2} fill="#f6f6f6" />
      {board.connectors.map((connector) => {
        const from = board.shapes.find((shape) => shape.id === connector.fromId)
        const to = board.shapes.find((shape) => shape.id === connector.toId)
        if (!from || !to) return null
        const segment = connectorSegment(from, to)
        return (
          <line
            key={connector.id}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke="#0b0b0b"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
      {board.shapes.map((shape) => (
        <ShapeGlyph key={shape.id} shape={shape} />
      ))}
    </svg>
  )
}

function ShapeGlyph({ shape }: { shape: Shape }) {
  const stroke = shape.stroke || '#0b0b0b'
  if (shape.kind === 'ellipse') {
    return (
      <ellipse
        cx={shape.x + shape.width / 2}
        cy={shape.y + shape.height / 2}
        rx={shape.width / 2}
        ry={shape.height / 2}
        fill={shape.fill}
        stroke={stroke}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    )
  }
  if (shape.kind === 'diamond') {
    const cx = shape.x + shape.width / 2
    const cy = shape.y + shape.height / 2
    const points = `${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${shape.y + shape.height} ${shape.x},${cy}`
    return <polygon points={points} fill={shape.fill} stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
  }
  if (shape.kind === 'text') {
    return (
      <text
        x={shape.x}
        y={shape.y + Math.min(shape.height, 28)}
        fill={stroke}
        fontSize="18"
        fontFamily="Open Runde, sans-serif"
      >
        {shape.text.slice(0, 24)}
      </text>
    )
  }
  return (
    <rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      rx="8"
      fill={shape.fill}
      stroke={stroke}
      strokeWidth="1.5"
      vectorEffect="non-scaling-stroke"
    />
  )
}
