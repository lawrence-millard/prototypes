import "server-only"

import { unstable_cache } from "next/cache"
import { listLinks } from "./data"
import { db } from "./db"
import { previewLinks } from "./preview"

const cached = unstable_cache(
  async (userId: string) => listLinks(await db(), userId),
  ["go-links-v1"],
  { revalidate: 30, tags: ["go-links"] },
)

export function readLinks(userId: string) {
  if (process.env.PREVIEW === "1") return Promise.resolve(previewLinks())
  return cached(userId)
}
