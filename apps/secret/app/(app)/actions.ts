'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { currentUserId } from '@/lib/auth'
import { bust } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { createSecret, deleteSecret, openLink, updateSecret } from '@/lib/flow'

async function run<T>(work: (userId: string) => Promise<T>) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'sign in required.' }
  try {
    const result = await work(userId)
    if (typeof result === 'object' && result && 'ok' in result && result.ok) bust(`secret:${userId}`)
    return result
  } catch {
    return { ok: false as const, error: 'could not save.' }
  }
}

export async function addSecret(input: unknown) {
  return run((userId) => createSecret(getDb(), userId, input))
}

export async function editSecret(input: unknown) {
  return run((userId) => updateSecret(getDb(), userId, input))
}

export async function removeSecret(input: unknown) {
  return run((userId) => deleteSecret(getDb(), userId, input))
}

export async function openSecret(input: unknown) {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'local'
  const bucket = createHash('sha256').update(forwarded.slice(0, 200)).digest('hex').slice(0, 32)
  try {
    return await openLink(getDb(), bucket, input)
  } catch {
    return { ok: false as const, error: 'could not open.' }
  }
}
