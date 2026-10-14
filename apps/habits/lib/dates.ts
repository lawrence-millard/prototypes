const labels = ["su", "mo", "tu", "we", "th", "fr", "sa"]

export function utcToday(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

export function addDays(day: string, delta: number) {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export function weekday(day: string) {
  return labels[new Date(`${day}T00:00:00.000Z`).getUTCDay()] ?? ""
}

export function week(today: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(today, index - 6)
    return { day, label: weekday(day), today: day === today }
  })
}

export function applyToggle(days: readonly string[], today: string, on: boolean) {
  const next = new Set(days)
  if (on) next.add(today)
  else next.delete(today)
  return [...next].sort()
}

export function streak(days: readonly string[], today: string) {
  const have = new Set(days)
  let cursor = have.has(today) ? today : addDays(today, -1)
  if (!have.has(cursor)) return 0
  let count = 0
  while (have.has(cursor) && count < 3660) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}
