import { LOCAL_OWNER_ID } from '../model/types'

export { LOCAL_OWNER_ID }

const PUBLISHABLE_KEY = /^pk_(test|live)_[A-Za-z0-9+/=_-]{20,200}$/

export function clerkPublishableKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isPlausibleClerkPublishableKey(key: string): boolean {
  return PUBLISHABLE_KEY.test(key)
}

export function readClerkPublishableKey(): string | null {
  return clerkPublishableKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
}
