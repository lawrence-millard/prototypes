export const BOARD_FORMAT = 'sketchpad-board' as const
export const BOARD_VERSION = 1 as const

export const LOCAL_OWNER_ID = 'local'

export type ShapeKind = 'rectangle' | 'ellipse' | 'diamond' | 'text'

export interface Shape {
  id: string
  kind: ShapeKind
  x: number
  y: number
  width: number
  height: number
  text: string
  fill: string
  stroke: string
}

export interface Connector {
  id: string
  fromId: string
  toId: string
}

export interface Board {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  shapes: Shape[]
  connectors: Connector[]
  sample: boolean
}

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export type Handle = 'nw' | 'ne' | 'sw' | 'se'

export type Tool = 'select' | 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'connector'
