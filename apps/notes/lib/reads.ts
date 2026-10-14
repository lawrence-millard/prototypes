import "server-only"

import { unstable_cache } from "next/cache"
import { getNote, listNotes } from "./data"
import { db } from "./db"
import { previewNotes } from "./preview"

const cachedList = unstable_cache(
  async (userId: string) => listNotes(await db(), userId),
  ["notes-notes-v1"],
  { revalidate: 30, tags: ["notes-notes"] },
)

const cachedOne = unstable_cache(
  async (userId: string, id: string) => getNote(await db(), userId, id),
  ["notes-one-v1"],
  { revalidate: 30, tags: ["notes-notes"] },
)

export function readNotes(userId: string) {
  if (process.env.PREVIEW === "1") return Promise.resolve(previewNotes())
  return cachedList(userId)
}

export function readNote(userId: string, id: string) {
  if (process.env.PREVIEW === "1") return Promise.resolve(previewNotes().find((note) => note.id === id) ?? null)
  return cachedOne(userId, id)
}
