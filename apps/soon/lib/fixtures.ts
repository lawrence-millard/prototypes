import type { EventItem } from './types'

const now = Date.now()

export const previewEvents: EventItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'launchday1',
    title: 'Launch',
    note: 'millard.ink',
    happensAt: new Date(now + 12 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'readingwk1',
    title: 'Reading week',
    note: '',
    happensAt: new Date(now + 3 * 86400000 + 4 * 3600000).toISOString(),
  },
]
