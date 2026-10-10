import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const DUMMY_HASH = createHash('sha256').update('hookbox-dummy-webhook-token').digest()

export function newWebhookToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function tokenMatches(providedToken: string, storedHex: string | null): boolean {
  const provided = createHash('sha256').update(providedToken).digest()
  const stored =
    storedHex && /^[0-9a-f]{64}$/i.test(storedHex) ? Buffer.from(storedHex, 'hex') : DUMMY_HASH
  const comparable = stored.length === provided.length ? stored : DUMMY_HASH
  const equal = timingSafeEqual(provided, comparable)
  return Boolean(equal && storedHex && /^[0-9a-f]{64}$/i.test(storedHex))
}
