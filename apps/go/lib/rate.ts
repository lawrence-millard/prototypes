export function nextRate(
  prev: { hits: number; start: number } | null,
  now: number,
  windowMs: number,
  limit: number,
) {
  if (!prev || now - prev.start >= windowMs) return { hits: 1, start: now, allowed: true }
  const hits = prev.hits + 1
  return { hits, start: prev.start, allowed: hits <= limit }
}

const buckets = new Map<string, { hits: number; start: number }>()

export function allowIp(ip: string, now = Date.now()) {
  const next = nextRate(buckets.get(ip) ?? null, now, 60_000, 120)
  buckets.set(ip, { hits: next.hits, start: next.start })
  if (buckets.size > 2000) {
    for (const [key, value] of buckets) {
      if (now - value.start >= 60_000) buckets.delete(key)
    }
  }
  return next.allowed
}

export function clientIp(header: string | null) {
  const ip = header?.split(",")[0]?.trim() ?? ""
  if (!ip || ip.length > 64 || /\s/.test(ip)) return "0"
  return ip
}
