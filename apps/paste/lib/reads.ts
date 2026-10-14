import "server-only"

import { unstable_cache } from "next/cache"
import { getPaste, listPastes } from "./data"
import { db } from "./db"

export const readPastes = unstable_cache(
  async (userId: string) => listPastes(await db(), userId),
  ["paste-pastes-v1"],
  { revalidate: 30, tags: ["paste-pastes"] },
)

export const readPaste = unstable_cache(
  async (userId: string, id: string) => getPaste(await db(), userId, id),
  ["paste-one-v1"],
  { revalidate: 30, tags: ["paste-pastes"] },
)
