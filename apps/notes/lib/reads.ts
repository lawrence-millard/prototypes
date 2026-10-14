import "server-only"

import { unstable_cache } from "next/cache"
import { getNote, listNotes } from "./data"
import { db } from "./db"

export const readNotes = unstable_cache(
  async (userId: string) => listNotes(await db(), userId),
  ["notes-notes-v1"],
  { revalidate: 30, tags: ["notes-notes"] },
)

export const readNote = unstable_cache(
  async (userId: string, id: string) => getNote(await db(), userId, id),
  ["notes-one-v1"],
  { revalidate: 30, tags: ["notes-notes"] },
)
