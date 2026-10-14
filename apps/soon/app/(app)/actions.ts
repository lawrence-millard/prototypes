'use server'

import { revalidatePath } from 'next/cache'
import { currentUserId } from '@/lib/auth'
import { bust } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { createEvent, deleteEvent, updateEvent } from '@/lib/flow'

async function run<T extends { ok: boolean; data?: { slug?: string } }>(work: (userId: string) => Promise<T>) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'sign in required.' }
  try {
    const result = await work(userId)
    if (result.ok) {
      bust(`soon:${userId}`)
      if (result.data?.slug) revalidatePath(`/e/${result.data.slug}`)
    }
    return result
  } catch {
    return { ok: false as const, error: 'could not save.' }
  }
}

export async function addEvent(input: unknown) {
  return run((userId) => createEvent(getDb(), userId, input))
}

export async function editEvent(input: unknown) {
  return run((userId) => updateEvent(getDb(), userId, input))
}

export async function removeEvent(input: unknown) {
  return run((userId) => deleteEvent(getDb(), userId, input))
}
