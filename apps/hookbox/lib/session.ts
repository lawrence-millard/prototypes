import { COOKIE_NAME, SESSION_SECONDS } from './constants'

export { COOKIE_NAME }

const encoder = new TextEncoder()

export async function signSession(
  username: string,
  secret: string,
  nowMs = Date.now(),
): Promise<string> {
  const payload = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        u: username,
        exp: Math.floor(nowMs / 1000) + SESSION_SECONDS,
      }),
    ),
  )
  const signature = bytesToBase64Url(await hmac(secret, payload))
  return `${payload}.${signature}`
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  expectedUser: string | undefined,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!token || !secret || secret.length < 32 || !expectedUser) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, signature] = parts
  if (!payload || !signature) return false
  const expected = bytesToBase64Url(await hmac(secret, payload))
  if (!fixedEqual(signature, expected)) return false
  const raw = base64UrlToBytes(payload)
  if (!raw) return false
  let data: { u?: unknown; exp?: unknown }
  try {
    data = JSON.parse(new TextDecoder().decode(raw)) as { u?: unknown; exp?: unknown }
  } catch {
    return false
  }
  if (typeof data.exp !== 'number' || !Number.isFinite(data.exp) || data.exp < nowMs / 1000) {
    return false
  }
  if (typeof data.u !== 'string') return false
  return constantStringEqual(data.u, expectedUser)
}

export async function constantStringEqual(a: string, b: string): Promise<boolean> {
  const [left, right] = await Promise.all([digest(a), digest(b)])
  return fixedBytesEqual(left, right)
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return new Uint8Array(signature)
}

async function digest(value: string): Promise<Uint8Array> {
  const hashed = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return new Uint8Array(hashed)
}

function fixedEqual(a: string, b: string): boolean {
  return fixedBytesEqual(encoder.encode(a), encoder.encode(b))
}

function fixedBytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!
  return diff === 0
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
