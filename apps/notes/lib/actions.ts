"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requireUserId } from "./auth"
import { createNote, deleteNote, updateNote } from "./data"
import { db } from "./db"
import type { State } from "./state"

function invalidate(path: string) {
  updateTag("notes-notes")
  revalidatePath("/")
  revalidatePath(path)
}

async function run(path: string, work: (sql: Awaited<ReturnType<typeof db>>, userId: string) => Promise<{ ok: boolean; id?: string; error?: string }>) {
  const userId = await requireUserId()
  if (!process.env.DATABASE_URL) return { state: { error: "unavailable" } as State, id: "" }
  try {
    const result = await work(await db(), userId)
    if (!result.ok) return { state: { error: result.error ?? "unavailable" } as State, id: "" }
    invalidate(path)
    return { state: null, id: result.id ?? "" }
  } catch {
    return { state: { error: "unavailable" } as State, id: "" }
  }
}

export async function createNoteAction(_state: State, formData: FormData): Promise<State> {
  const result = await run("/", (sql, userId) => createNote(sql, userId, {
    title: formData.get("title"),
    body: formData.get("body"),
  }))
  if (result.state) return result.state
  redirect(`/n/${result.id}`)
}

export async function updateNoteAction(_state: State, formData: FormData): Promise<State> {
  const id = String(formData.get("id") ?? "")
  const result = await run(`/n/${id}`, (sql, userId) => updateNote(sql, userId, {
    id,
    title: formData.get("title"),
    body: formData.get("body"),
  }))
  if (result.state) return result.state
  redirect(`/n/${id}`)
}

export async function deleteNoteAction(formData: FormData) {
  const result = await run("/", (sql, userId) => deleteNote(sql, userId, formData.get("id")))
  if (result.state?.error) redirect(`/?e=${result.state.error}`)
  redirect("/")
}
