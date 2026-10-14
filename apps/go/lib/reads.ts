import "server-only"

import { unstable_cache } from "next/cache"
import { listLinks } from "./data"
import { db } from "./db"

export const readLinks = unstable_cache(
  async (userId: string) => listLinks(await db(), userId),
  ["go-links-v1"],
  { revalidate: 30, tags: ["go-links"] },
)
