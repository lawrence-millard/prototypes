"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requireUserId } from "./auth"
import { createHabit, deleteHabit, renameHabit, setCheck } from "./data"
import { db } from "./db"
import type { State } from "./state"

function invalidate() {
  updateTag("habits-habits")
  revalidatePath("/")
}

async function run(work: (sql: Awaited<ReturnType<typeof db>>, userId: string) => Promise<{ ok: boolean; error?: string }>) {
  const userId = await requireUserId()
  if (!process.env.DATABASE_URL) return { error: "unavailable" } satisfies State
  try {
    const result = await work(await db(), userId)
    if (!result.ok) return { error: result.error ?? "unavailable" } satisfies State
  } catch {
    return { error: "unavailable" } satisfies State
  }
  invalidate()
  return null
}

export async function createHabitAction(_state: State, formData: FormData): Promise<State> {
  const state = await run((sql, userId) => createHabit(sql, userId, formData.get("name")))
  if (state) return state
  redirect("/")
}

export async function renameHabitAction(id: string, name: string): Promise<State> {
  return run((sql, userId) => renameHabit(sql, userId, id, name))
}

export async function toggleHabitAction(id: string, on: string, day: string): Promise<State> {
  return run((sql, userId) => setCheck(sql, userId, { id, on, day }))
}

export async function deleteHabitAction(id: string): Promise<State> {
  return run((sql, userId) => deleteHabit(sql, userId, id))
}
