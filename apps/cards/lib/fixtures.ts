import type { Deck, DeckDetail } from './types'

export const previewDeckId = '11111111-1111-4111-8111-111111111111'

export const previewDecks: Deck[] = [
  { id: previewDeckId, name: 'Irregular verbs', cards: 24, due: 6 },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Capitals', cards: 12, due: 0 },
]

const now = Date.now()

export const previewDeck: DeckDetail = {
  id: previewDeckId,
  name: 'Irregular verbs',
  cards: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      front: 'ser',
      back: 'to be',
      ease: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: new Date(now - 60_000).toISOString(),
      createdAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      front: 'ir',
      back: 'to go',
      ease: 2.5,
      intervalDays: 1,
      repetitions: 1,
      dueAt: new Date(now + 86400000).toISOString(),
      createdAt: new Date(now - 86400000).toISOString(),
    },
  ],
}
