import "server-only"

import { unstable_cache } from "next/cache"
import { getPaste, listPastes } from "./data"
import { db } from "./db"
import { previewPastes } from "./preview"

const cachedList = unstable_cache(
  async (userId: string) => listPastes(await db(), userId),
  ["paste-pastes-v1"],
  { revalidate: 30, tags: ["paste-pastes"] },
)

const cachedOne = unstable_cache(
  async (userId: string, id: string) => getPaste(await db(), userId, id),
  ["paste-one-v1"],
  { revalidate: 30, tags: ["paste-pastes"] },
)

export function readPastes(userId: string) {
  if (process.env.PREVIEW === "1") return Promise.resolve(previewPastes())
  return cachedList(userId)
}

export function readPaste(userId: string, id: string) {
  if (process.env.PREVIEW === "1") return Promise.resolve(previewPastes().find((paste) => paste.id === id) ?? null)
  return cachedOne(userId, id)
}
