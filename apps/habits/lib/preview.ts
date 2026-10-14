import { addDays, utcToday } from "./dates"
import type { Habit } from "./data"

const hour = 3_600_000

export function previewHabits(now = Date.now()): Habit[] {
  const today = utcToday(new Date(now))
  return [
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f81",
      name: "Walk",
      days: [0, 1, 2, 3].map((delta) => addDays(today, -delta)),
      createdAt: new Date(now - 3 * hour).toISOString(),
    },
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f82",
      name: "Read",
      days: [addDays(today, -1)],
      createdAt: new Date(now - 2 * 24 * hour).toISOString(),
    },
  ]
}
