'use server'

import { currentUserId } from '@/lib/auth'
import { bust } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { createCard, createDeck, deleteCard, deleteDeck, renameDeck, reviewCard, updateCard } from '@/lib/flow'

async function run<T>(work: (userId: string) => Promise<T>) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'sign in required.' }
  try {
    const result = await work(userId)
    if (typeof result === 'object' && result && 'ok' in result && result.ok) bust(`cards:${userId}`)
    return result
  } catch {
    return { ok: false as const, error: 'could not save.' }
  }
}

export async function addDeck(input: unknown) {
  return run((userId) => createDeck(getDb(), userId, input))
}

export async function editDeck(input: unknown) {
  return run((userId) => renameDeck(getDb(), userId, input))
}

export async function removeDeck(input: unknown) {
  return run((userId) => deleteDeck(getDb(), userId, input))
}

export async function addCard(input: unknown) {
  return run((userId) => createCard(getDb(), userId, input))
}

export async function editCard(input: unknown) {
  return run((userId) => updateCard(getDb(), userId, input))
}

export async function removeCard(input: unknown) {
  return run((userId) => deleteCard(getDb(), userId, input))
}

export async function gradeCard(input: unknown) {
  return run((userId) => reviewCard(getDb(), userId, input))
}
