import assert from "node:assert/strict"
import test from "node:test"
import { createHabit, deleteHabit, listHabits, renameHabit, setCheck } from "../lib/data.ts"
import { addDays, applyToggle, streak, utcToday, week, weekday } from "../lib/dates.ts"
import { LIST_LIMIT, WRITE_LIMIT } from "../lib/limits.ts"
import type { Sql } from "../lib/sql.ts"
import { parseName, parseToggle } from "../lib/validate.ts"

function capture(rows: Record<string, unknown>[] = []) {
  const calls: { text: string; values: unknown[] }[] = []
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ text: strings.join("?"), values })
    return rows
  }) as Sql
  return { sql, calls }
}

const id = "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f50"
const today = "2026-10-14"
const now = new Date("2026-10-14T12:00:00.000Z")

test("days and streaks stay on utc", () => {
  assert.equal(utcToday(now), today)
  assert.equal(addDays(today, 30), "2026-11-13")
  assert.equal(weekday(today), "we")
  const days = week(today)
  assert.equal(days.length, 7)
  assert.equal(days[6]?.day, today)
  assert.equal(days[6]?.today, true)
  assert.deepEqual(applyToggle(["2026-10-12"], today, true), ["2026-10-12", today])
  assert.deepEqual(applyToggle(["2026-10-12", today], today, false), ["2026-10-12"])
  assert.equal(streak([today, "2026-10-13", "2026-10-12"], today), 3)
  assert.equal(streak(["2026-10-13", "2026-10-12"], today), 2)
  assert.equal(streak(["2026-10-12"], today), 0)
  assert.equal(parseName("  walk  ").ok, true)
  assert.equal(parseName("  ").ok, false)
  assert.equal(parseName("a".repeat(41)).ok, false)
  assert.equal(parseToggle({ id, on: "1", day: today }).ok, true)
  assert.equal(parseToggle({ id, on: "2", day: today }).ok, false)
  assert.equal(parseToggle({ id, on: "1", day: "14-10-2026" }).ok, false)
})

test("habits and checks stay on the owning clerk user", async () => {
  const listed = capture([{ id, name: "walk", days: `["${today}"]` }])
  const habits = await listHabits(listed.sql, "user_a")
  assert.equal(habits[0]?.name, "walk")
  assert.deepEqual(habits[0]?.days, [today])
  assert.match(listed.calls[0]!.text, /user_id/)
  assert.match(listed.calls[0]!.text, /habits_habits/)
  assert.match(listed.calls[0]!.text, /habits_checks/)
  assert.equal(listed.calls[0]!.values.includes("user_a"), true)
  assert.equal(listed.calls[0]!.values.includes("user_b"), false)

  const created = capture([{ hits: 1, n: 0, id }])
  assert.deepEqual(await createHabit(created.sql, "user_a", "walk"), { ok: true, id })
  assert.match(created.calls[0]!.text, /habits_rate_limits/)
  assert.match(created.calls[0]!.text, /10 minutes/)
  assert.equal(created.calls[0]!.values.includes(WRITE_LIMIT), true)
  assert.equal(created.calls[0]!.values.includes(LIST_LIMIT), true)
  assert.equal(created.calls[0]!.values.includes("user_a"), true)

  const full = capture([{ hits: 1, n: LIST_LIMIT, id: null }])
  assert.deepEqual(await createHabit(full.sql, "user_a", "walk"), { ok: false, error: "limit" })

  const renamed = capture([{ hits: 1, id: null }])
  assert.deepEqual(await renameHabit(renamed.sql, "user_a", id, "run"), { ok: false, error: "missing" })
  assert.equal(renamed.calls[0]!.values.includes("user_a"), true)

  const stale = capture()
  assert.deepEqual(await setCheck(stale.sql, "user_a", { id, on: "1", day: "2026-10-13" }, now), { ok: false, error: "invalid" })
  assert.equal(stale.calls.length, 0)

  const checked = capture([{ hits: 1, owned: id, id }])
  assert.deepEqual(await setCheck(checked.sql, "user_a", { id, on: "1", day: today }, now), { ok: true, id })
  assert.match(checked.calls[0]!.text, /INSERT INTO habits_checks/)
  assert.equal(checked.calls[0]!.values.includes("user_a"), true)
  assert.equal(checked.calls[0]!.values.includes(today), true)

  const cleared = capture([{ hits: 1, owned: id }])
  assert.deepEqual(await setCheck(cleared.sql, "user_a", { id, on: "0", day: today }, now), { ok: true, id })
  assert.match(cleared.calls[0]!.text, /DELETE FROM habits_checks/)
  assert.equal(cleared.calls[0]!.values.includes("user_a"), true)

  const foreign = capture([{ hits: 1, owned: null }])
  assert.deepEqual(await setCheck(foreign.sql, "user_b", { id, on: "1", day: today }, now), { ok: false, error: "missing" })
  assert.equal(foreign.calls[0]!.values.includes("user_b"), true)
  assert.equal(foreign.calls[0]!.values.includes("user_a"), false)

  const slowed = capture([{ hits: WRITE_LIMIT + 1, id: null }])
  assert.deepEqual(await deleteHabit(slowed.sql, "user_a", id), { ok: false, error: "rate" })
  assert.match(slowed.calls[0]!.text, /DELETE FROM habits_habits/)
  assert.equal(slowed.calls[0]!.values.includes("user_a"), true)
})
