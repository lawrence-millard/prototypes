import type { ShapeKind } from './types'

export const MAX_IMPORT_CHARS = 1_000_000
export const MAX_SHAPES = 400
export const MAX_CONNECTORS = 800
export const MAX_TEXT = 2_000
export const MAX_NAME = 80
export const MAX_ID = 80
export const MIN_SHAPE = 16
export const MAX_SHAPE = 4_000
export const MIN_COORD = -5_000
export const MAX_COORD = 20_000
export const HISTORY_LIMIT = 100
export const PNG_MAX_EDGE = 2_048
export const AUTOSAVE_MS = 400

export const INK = '#1a1814'
export const CANVAS = '#fffdf8'
export const HALO = '#fffdf8'
export const TEXT_STROKE = '#8d8478'

export const FILLS = [
  { id: 'sand', label: 'Sand', value: '#f3e6c8' },
  { id: 'mint', label: 'Mint', value: '#d7ebe3' },
  { id: 'clay', label: 'Clay', value: '#f6d6d0' },
  { id: 'mist', label: 'Mist', value: '#d9e2f2' },
  { id: 'lilac', label: 'Lilac', value: '#ece7f6' },
  { id: 'paper', label: 'Paper', value: '#fffdf8' },
] as const

export const SHAPE_DEFAULTS: Record<
  ShapeKind,
  { width: number; height: number; fill: string; stroke: string }
> = {
  rectangle: { width: 168, height: 96, fill: '#f3e6c8', stroke: INK },
  ellipse: { width: 168, height: 104, fill: '#d7ebe3', stroke: INK },
  diamond: { width: 160, height: 120, fill: '#f6d6d0', stroke: INK },
  text: { width: 220, height: 64, fill: CANVAS, stroke: TEXT_STROKE },
}

export const CANVAS_SIZE = { width: 2400, height: 1600 }

export const SHORTCUTS: ReadonlyArray<{ keys: string; action: string }> = [
  { keys: 'V', action: 'Select' },
  { keys: 'R', action: 'Rectangle' },
  { keys: 'E', action: 'Ellipse' },
  { keys: 'D', action: 'Diamond' },
  { keys: 'T', action: 'Text' },
  { keys: 'C', action: 'Connector' },
  { keys: 'Delete or Backspace', action: 'Delete the selected shape' },
  { keys: 'Ctrl or Cmd + Z', action: 'Undo' },
  { keys: 'Ctrl or Cmd + Shift + Z', action: 'Redo' },
  { keys: 'Ctrl or Cmd + Y', action: 'Redo' },
  { keys: 'Ctrl or Cmd + S', action: 'Save now' },
  { keys: 'Arrow keys', action: 'Nudge the selection by 1' },
  { keys: 'Shift + Arrow', action: 'Nudge the selection by 10' },
  { keys: 'Alt + Arrow', action: 'Resize the selection' },
  { keys: '?', action: 'Open keyboard shortcuts' },
  { keys: 'Escape', action: 'Clear the selection or close a dialog' },
]
