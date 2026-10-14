import assert from "node:assert/strict"
import test from "node:test"
import { randomCode, validCode } from "../lib/code.ts"
import { createLink, deleteLink, hitLink, listLinks, updateLink } from "../lib/data.ts"
import { LIST_LIMIT, WRITE_LIMIT } from "../lib/limits.ts"
import { requestOrigin } from "../lib/origin.ts"
import { allowIp, nextRate } from "../lib/rate.ts"
import type { Sql } from "../lib/sql.ts"
import { parseLink } from "../lib/validate.ts"
import { safeHttpUrl } from "../lib/url.ts"

function capture(rows: Record<string, unknown>[] = [{ hits: 1, n: 0, id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f50" }]) {
  const calls: { text: string; values: unknown[] }[] = []
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ text: strings.join("?"), values })
    return rows
  }) as Sql
  return { sql, calls }
}

test("parseLink accepts http(s) and optional codes", () => {
  const parsed = parseLink({ url: "https://example.com/a?b=1", code: "Abc-1" })
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    assert.equal(parsed.url, "https://example.com/a?b=1")
    assert.equal(parsed.code, "abc-1")
  }
  assert.equal(parseLink({ url: "javascript:alert(1)", code: "" }).ok, false)
  assert.equal(parseLink({ url: "https://user:pass@example.com", code: "" }).ok, false)
  assert.equal(parseLink({ url: "https://example.com", code: "no" }).ok, false)
  assert.equal(safeHttpUrl("data:text/html,hi"), null)
})

test("codes are short and unambiguous", () => {
  const code = randomCode()
  assert.equal(code.length, 7)
  assert.equal(validCode(code), true)
  assert.equal(/[0ol1]/.test(code), false)
})

test("origin uses the request host", () => {
  assert.equal(requestOrigin("go.millard.ink", "https"), "https://go.millard.ink")
  assert.equal(requestOrigin("localhost:4111", "http"), "http://localhost:4111")
  assert.equal(requestOrigin("evil.com/path", "https"), "")
  assert.equal(requestOrigin("go.millard.ink", "https").includes("vercel.app"), false)
})

test("rate window resets", () => {
  assert.deepEqual(nextRate(null, 1_000, 60_000, 2), { hits: 1, start: 1_000, allowed: true })
  assert.equal(nextRate({ hits: 2, start: 1_000 }, 2_000, 60_000, 2).allowed, false)
  assert.equal(nextRate({ hits: 2, start: 1_000 }, 61_000, 60_000, 2).allowed, true)
  const ip = `unit-${Date.now()}`
  for (let i = 0; i < 120; i++) assert.equal(allowIp(ip, 5_000), true)
  assert.equal(allowIp(ip, 5_000), false)
})

test("list and writes are scoped to the clerk user", async () => {
  const listed = capture([{ id: "1", code: "abc", url: "https://example.com/", clicks: 2, created_at: "2026-10-14T00:00:00.000Z" }])
  const links = await listLinks(listed.sql, "user_a")
  assert.equal(links[0]?.code, "abc")
  assert.match(listed.calls[0]!.text, /user_id/)
  assert.equal(listed.calls[0]!.values.includes("user_a"), true)
  assert.equal(listed.calls[0]!.values.includes("user_b"), false)

  const created = capture()
  const result = await createLink(created.sql, "user_a", { url: "https://example.com/x", code: "demo" })
  assert.equal(result.ok, true)
  assert.match(created.calls[0]!.text, /go_links/)
  assert.match(created.calls[0]!.text, /go_rate_limits/)
  assert.match(created.calls[0]!.text, /10 minutes/)
  assert.equal(created.calls[0]!.values.includes("user_a"), true)
  assert.equal(created.calls[0]!.values.includes(WRITE_LIMIT), true)
  assert.equal(created.calls[0]!.values.includes(LIST_LIMIT), true)

  const full = capture([{ hits: 1, n: LIST_LIMIT, id: null }])
  const limited = await createLink(full.sql, "user_a", { url: "https://example.com/x", code: "demo" })
  assert.deepEqual(limited, { ok: false, error: "limit" })

  const slowed = capture([{ hits: WRITE_LIMIT + 1, n: 0, id: null }])
  const rate = await updateLink(slowed.sql, "user_a", { id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f50", url: "https://example.com/y" })
  assert.deepEqual(rate, { ok: false, error: "rate" })
  assert.equal(slowed.calls[0]!.values.filter((value) => value === "user_a").length >= 1, true)

  const removed = capture([{ hits: 1, id: null }])
  const missing = await deleteLink(removed.sql, "user_a", "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f50")
  assert.deepEqual(missing, { ok: false, error: "missing" })
  assert.match(removed.calls[0]!.text, /user_id/)
})

test("public redirect looks up by code only", async () => {
  const hit = capture([{ url: "https://example.com/z" }])
  assert.equal(await hitLink(hit.sql, "abcdef"), "https://example.com/z")
  assert.equal(hit.calls[0]!.text.includes("user_id"), false)
  assert.deepEqual(hit.calls[0]!.values, ["abcdef"])
  const bad = capture([{ url: "javascript:alert(1)" }])
  assert.equal(await hitLink(bad.sql, "abcdef"), null)
})
