"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { requireUserId } from "./auth"
import { createLink, deleteLink, updateLink } from "./data"
import { db } from "./db"
import type { State } from "./state"

function invalidate() {
  updateTag("go-links")
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

export async function createLinkAction(_state: State, formData: FormData): Promise<State> {
  const state = await run((sql, userId) => createLink(sql, userId, {
    url: formData.get("url"),
    code: formData.get("code"),
  }))
  if (state) return state
  redirect("/")
}

export async function updateLinkAction(_state: State, formData: FormData): Promise<State> {
  const state = await run((sql, userId) => updateLink(sql, userId, {
    id: formData.get("id"),
    url: formData.get("url"),
  }))
  if (state) return state
  redirect("/")
}

export async function deleteLinkAction(formData: FormData) {
  const state = await run((sql, userId) => deleteLink(sql, userId, formData.get("id")))
  if (state?.error) redirect(`/?e=${state.error}`)
  redirect("/")
}
