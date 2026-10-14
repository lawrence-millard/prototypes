import type { Board } from './types'

export const SAMPLE_BOARD_ID = 'sample-personal-whiteboard'

export function createSampleBoard(now = Date.now()): Board {
  return {
    id: SAMPLE_BOARD_ID,
    name: 'Sample: personal whiteboard',
    createdAt: now,
    updatedAt: now,
    sample: true,
    shapes: [
      {
        id: 'sample-idea',
        kind: 'rectangle',
        x: 120,
        y: 180,
        width: 180,
        height: 96,
        text: 'Idea',
        fill: '#e6e6e6',
        stroke: '#0b0b0b',
      },
      {
        id: 'sample-sketch',
        kind: 'ellipse',
        x: 460,
        y: 160,
        width: 180,
        height: 120,
        text: 'Sketch',
        fill: '#f6f6f6',
        stroke: '#0b0b0b',
      },
      {
        id: 'sample-decide',
        kind: 'diamond',
        x: 280,
        y: 400,
        width: 180,
        height: 130,
        text: 'Decide',
        fill: '#cfcfcf',
        stroke: '#0b0b0b',
      },
      {
        id: 'sample-note',
        kind: 'text',
        x: 120,
        y: 72,
        width: 520,
        height: 56,
        text: 'Sample data. You can delete it in one click.',
        fill: '#f6f6f6',
        stroke: '#5a5a5a',
      },
    ],
    connectors: [
      { id: 'sample-c1', fromId: 'sample-idea', toId: 'sample-sketch' },
      { id: 'sample-c2', fromId: 'sample-sketch', toId: 'sample-decide' },
      { id: 'sample-c3', fromId: 'sample-idea', toId: 'sample-decide' },
    ],
  }
}
