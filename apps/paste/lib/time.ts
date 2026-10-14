export const expiries = ["1h", "1d", "7d", "30d"] as const
export type Expiry = (typeof expiries)[number]

const spans: Record<Expiry, number> = {
  "1h": 3_600_000,
  "1d": 86_400_000,
  "7d": 604_800_000,
  "30d": 2_592_000_000,
}

export function expiryFrom(choice: Expiry, now: number) {
  return new Date(now + spans[choice]).toISOString()
}

export function remaining(iso: string, now: number) {
  const ms = new Date(iso).getTime() - now
  if (!Number.isFinite(ms) || ms <= 0) return "0m"
  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.ceil(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.ceil(hours / 24)}d`
}

export function excerpt(body: string) {
  const line = body.split("\n").map((item) => item.trim()).find(Boolean) ?? ""
  if (line.length <= 80) return line
  return `${line.slice(0, 79)}…`
}
