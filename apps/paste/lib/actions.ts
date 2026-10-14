"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requireUserId } from "./auth"
import { createPaste, deletePaste, updatePaste } from "./data"
import { db } from "./db"
import type { State } from "./state"

function invalidate(path: string) {
  updateTag("paste-pastes")
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

export async function createPasteAction(_state: State, formData: FormData): Promise<State> {
  const result = await run("/", (sql, userId) => createPaste(sql, userId, {
    body: formData.get("body"),
    expiry: formData.get("expiry"),
  }))
  if (result.state) return result.state
  redirect(`/p/${result.id}`)
}

export async function updatePasteAction(_state: State, formData: FormData): Promise<State> {
  const id = String(formData.get("id") ?? "")
  const result = await run(`/p/${id}`, (sql, userId) => updatePaste(sql, userId, {
    id: formData.get("id"),
    body: formData.get("body"),
  }))
  if (result.state) return result.state
  redirect(`/p/${id}`)
}

export async function deletePasteAction(formData: FormData) {
  const result = await run("/", (sql, userId) => deletePaste(sql, userId, formData.get("id")))
  if (result.state?.error) redirect(`/?e=${result.state.error}`)
  redirect("/")
}
