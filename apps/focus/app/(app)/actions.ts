'use server'

import { currentUserId } from '@/lib/auth'
import { bust } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { createSession, deleteSession, updateSession } from '@/lib/flow'

async function run<T>(work: (userId: string) => Promise<T>) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'sign in required.' }
  try {
    const result = await work(userId)
    if (typeof result === 'object' && result && 'ok' in result && result.ok) bust(`focus:${userId}`)
    return result
  } catch {
    return { ok: false as const, error: 'could not save.' }
  }
}

export async function saveSession(input: unknown) {
  return run((userId) => createSession(getDb(), userId, input))
}

export async function renameSession(input: unknown) {
  return run((userId) => updateSession(getDb(), userId, input))
}

export async function removeSession(input: unknown) {
  return run((userId) => deleteSession(getDb(), userId, input))
}
