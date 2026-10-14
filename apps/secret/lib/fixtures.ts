import type { SecretItem } from './types'

const now = Date.now()

export const previewSecrets: SecretItem[] = [
  {
    id: 'k7m2p9qx4n8w1r6t',
    expiresAt: new Date(now + 20 * 3600000).toISOString(),
    createdAt: new Date(now - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 'b3v8c1zd5h2y7a9e',
    expiresAt: new Date(now + 6 * 86400000).toISOString(),
    createdAt: new Date(now - 2 * 86400000).toISOString(),
  },
]
