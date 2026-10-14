import { z } from 'zod'

export const secretId = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/)
const expiresIn = z.enum(['1h', '1d', '7d'])
const ciphertext = z.string().regex(/^[A-Za-z0-9+/]+=*$/).min(24).max(20000)
const iv = z.string().regex(/^[A-Za-z0-9+/]{16}$/)

export const createSchema = z.object({ ciphertext, iv, expiresIn })
export const updateSchema = z.object({ id: secretId, expiresIn })
export const deleteSchema = z.object({ id: secretId })
export const openSchema = z.object({ id: secretId })

export const expirySeconds = { '1h': 3600, '1d': 86400, '7d': 604800 } as const
