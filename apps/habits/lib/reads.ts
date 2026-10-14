import "server-only"

import { unstable_cache } from "next/cache"
import { listHabits } from "./data"
import { db } from "./db"

export const readHabits = unstable_cache(
  async (userId: string) => listHabits(await db(), userId),
  ["habits-habits-v1"],
  { revalidate: 30, tags: ["habits-habits"] },
)
