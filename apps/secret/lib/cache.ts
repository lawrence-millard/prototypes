import 'server-only'
import { unstable_cache, updateTag } from 'next/cache'

export function readCache<T>(parts: string[], tag: string, load: () => Promise<T>) {
  return unstable_cache(load, parts, { tags: [tag], revalidate: 30 })()
}

export function bust(tag: string) {
  updateTag(tag)
}
