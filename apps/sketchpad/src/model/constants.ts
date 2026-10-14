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

export const INK = '#0b0b0b'
export const CANVAS = '#f6f6f6'
export const HALO = '#f6f6f6'
export const TEXT_STROKE = '#5a5a5a'

export const FILLS = [
  { id: 'paper', label: 'Paper', value: '#f6f6f6' },
  { id: 'mist', label: 'Mist', value: '#e6e6e6' },
  { id: 'ash', label: 'Ash', value: '#cfcfcf' },
  { id: 'slate', label: 'Slate', value: '#8a8a8a' },
  { id: 'ink', label: 'Ink', value: '#1a1a1a' },
  { id: 'black', label: 'Black', value: '#0b0b0b' },
] as const

export const SHAPE_DEFAULTS: Record<
  ShapeKind,
  { width: number; height: number; fill: string; stroke: string }
> = {
  rectangle: { width: 168, height: 96, fill: '#e6e6e6', stroke: INK },
  ellipse: { width: 168, height: 104, fill: '#f6f6f6', stroke: INK },
  diamond: { width: 160, height: 120, fill: '#cfcfcf', stroke: INK },
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
