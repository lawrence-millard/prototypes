import assert from "node:assert/strict"
import test from "node:test"
import { createPaste, deletePaste, getPaste, listPastes, updatePaste } from "../lib/data.ts"
import { LIST_LIMIT, WRITE_LIMIT } from "../lib/limits.ts"
import type { Sql } from "../lib/sql.ts"
import { excerpt, expiryFrom, remaining } from "../lib/time.ts"
import { parsePaste } from "../lib/validate.ts"

function capture(rows: Record<string, unknown>[] = []) {
  const calls: { text: string; values: unknown[] }[] = []
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ text: strings.join("?"), values })
    return rows
  }) as Sql
  return { sql, calls }
}

const id = "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f50"

test("expiry and excerpt", () => {
  const now = Date.parse("2026-10-14T00:00:00.000Z")
  assert.equal(expiryFrom("1h", now), "2026-10-14T01:00:00.000Z")
  assert.equal(expiryFrom("30d", now), "2026-11-13T00:00:00.000Z")
  assert.equal(remaining("2026-10-14T00:30:00.000Z", now), "30m")
  assert.equal(remaining("2026-10-14T03:00:00.000Z", now), "3h")
  assert.equal(remaining("2026-10-20T00:00:00.000Z", now), "6d")
  assert.equal(excerpt("  alpha\nbeta"), "alpha")
  assert.equal(excerpt("x".repeat(90)).length, 80)
  assert.equal(parsePaste({ body: "  ", expiry: "1d" }).ok, false)
  assert.equal(parsePaste({ body: "hello", expiry: "1y" }).ok, false)
  const parsed = parsePaste({ body: "hello", expiry: "7d" })
  assert.equal(parsed.ok, true)
})

test("queries belong to the clerk user and hide expired rows", async () => {
  const listed = capture([{ id, body: "hello", expires_at: "2026-10-15T00:00:00.000Z", created_at: "2026-10-14T00:00:00.000Z" }])
  const pastes = await listPastes(listed.sql, "user_a")
  assert.equal(pastes[0]?.body, "hello")
  assert.match(listed.calls[0]!.text, /user_id/)
  assert.match(listed.calls[0]!.text, /expires_at > now\(\)/)
  assert.equal(listed.calls[0]!.values.includes("user_a"), true)

  const one = capture([])
  assert.equal(await getPaste(one.sql, "user_a", id), null)
  assert.equal(one.calls[0]!.values.includes("user_a"), true)
  assert.equal(one.calls[0]!.values.includes("user_b"), false)

  const created = capture([{ hits: 1, n: 0, id }])
  const result = await createPaste(created.sql, "user_a", { body: "hello", expiry: "1d" }, Date.parse("2026-10-14T00:00:00.000Z"))
  assert.deepEqual(result, { ok: true, id })
  assert.match(created.calls[0]!.text, /paste_pastes/)
  assert.match(created.calls[0]!.text, /paste_rate_limits/)
  assert.equal(created.calls[0]!.values.includes(WRITE_LIMIT), true)
  assert.equal(created.calls[0]!.values.includes("user_a"), true)
  assert.equal(created.calls[0]!.values.includes("2026-10-15T00:00:00.000Z"), true)

  const full = capture([{ hits: 1, n: LIST_LIMIT, id: null }])
  assert.deepEqual(await createPaste(full.sql, "user_a", { body: "hello", expiry: "1h" }), { ok: false, error: "limit" })

  const missing = capture([{ hits: 1, id: null }])
  assert.deepEqual(await updatePaste(missing.sql, "user_a", { id, body: "next" }), { ok: false, error: "missing" })
  assert.match(missing.calls[0]!.text, /user_id/)

  const slowed = capture([{ hits: WRITE_LIMIT + 1, id: null }])
  assert.deepEqual(await deletePaste(slowed.sql, "user_a", id), { ok: false, error: "rate" })
})
