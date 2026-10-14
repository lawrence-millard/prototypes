import type { Session } from './types'

export const previewSessions: Session[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    kind: 'focus',
    seconds: 1500,
    label: 'Draft',
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    kind: 'short',
    seconds: 300,
    label: 'Walk',
    completedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
]
