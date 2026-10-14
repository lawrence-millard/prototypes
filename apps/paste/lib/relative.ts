export function relativeTime(iso: string, now = Date.now()) {
  const ms = now - new Date(iso).getTime()
  if (!Number.isFinite(ms)) return ""
  const abs = Math.abs(ms)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (abs < minute) return "just now"
  if (abs < hour) return `${Math.floor(abs / minute)}m`
  if (abs < day) return `${Math.floor(abs / hour)}h`
  if (abs < 30 * day) return `${Math.floor(abs / day)}d`
  if (abs < 365 * day) return `${Math.floor(abs / (30 * day))}mo`
  return `${Math.floor(abs / (365 * day))}y`
}
