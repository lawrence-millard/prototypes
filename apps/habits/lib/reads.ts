import "server-only"

import { unstable_cache } from "next/cache"
import { listHabits } from "./data"
import { db } from "./db"
import { previewHabits } from "./preview"

const cached = unstable_cache(
  async (userId: string) => listHabits(await db(), userId),
  ["habits-habits-v1"],
  { revalidate: 30, tags: ["habits-habits"] },
)

export function readHabits(userId: string) {
  if (process.env.PREVIEW === "1") return Promise.resolve(previewHabits())
  return cached(userId)
}
