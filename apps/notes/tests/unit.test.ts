import assert from "node:assert/strict"
import test from "node:test"
import { createNote, deleteNote, getNote, listNotes, updateNote } from "../lib/data.ts"
import { LIST_LIMIT, WRITE_LIMIT } from "../lib/limits.ts"
import { renderMarkdown } from "../lib/markdown.ts"
import type { Sql } from "../lib/sql.ts"
import { parseNote } from "../lib/validate.ts"

function capture(rows: Record<string, unknown>[] = []) {
  const calls: { text: string; values: unknown[] }[] = []
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ text: strings.join("?"), values })
    return rows
  }) as Sql
  return { sql, calls }
}

const id = "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f50"

test("markdown escapes html and rejects unsafe links", () => {
  const html = renderMarkdown("# Title\n\n<script>alert(1)</script>\n\n**bold** *em* `x`\n\n- one\n- two\n\n[ok](https://example.com/a)\n[bad](javascript:alert(1))\n\n```\n<b>code</b>\n```")
  assert.equal(html.includes("<script"), false)
  assert.equal(html.includes("javascript:"), false)
  assert.match(html, /<h2>Title<\/h2>/)
  assert.match(html, /<strong>bold<\/strong>/)
  assert.match(html, /<em>em<\/em>/)
  assert.match(html, /<li>one<\/li>/)
  assert.match(html, /href="https:\/\/example\.com\/a"/)
  assert.match(html, /&lt;b&gt;code&lt;\/b&gt;/)
  assert.equal(parseNote({ title: "  ", body: "" }).ok, false)
  assert.equal(parseNote({ title: "List", body: "" }).ok, true)
})

test("notes stay on the owning clerk user", async () => {
  const listed = capture([{ id, title: "List", updated_at: "2026-10-14T00:00:00.000Z" }])
  const notes = await listNotes(listed.sql, "user_a")
  assert.equal(notes[0]?.title, "List")
  assert.match(listed.calls[0]!.text, /user_id/)
  assert.equal(listed.calls[0]!.text.includes("body"), false)
  assert.equal(listed.calls[0]!.values.includes("user_a"), true)

  const hidden = capture([])
  assert.equal(await getNote(hidden.sql, "user_b", id), null)
  assert.deepEqual(hidden.calls[0]!.values, [id, "user_b"])

  const created = capture([{ hits: 1, n: 0, id }])
  assert.deepEqual(await createNote(created.sql, "user_a", { title: "List", body: "hello" }), { ok: true, id })
  assert.match(created.calls[0]!.text, /notes_notes/)
  assert.equal(created.calls[0]!.values.includes(WRITE_LIMIT), true)
  assert.equal(created.calls[0]!.values.includes("user_a"), true)

  const full = capture([{ hits: 1, n: LIST_LIMIT, id: null }])
  assert.deepEqual(await createNote(full.sql, "user_a", { title: "List", body: "" }), { ok: false, error: "limit" })

  const missing = capture([{ hits: 1, id: null }])
  assert.deepEqual(await updateNote(missing.sql, "user_a", { id, title: "Next", body: "x" }), { ok: false, error: "missing" })
  assert.equal(missing.calls[0]!.values.includes("user_a"), true)

  const slowed = capture([{ hits: WRITE_LIMIT + 1, id: null }])
  assert.deepEqual(await deleteNote(slowed.sql, "user_a", id), { ok: false, error: "rate" })
})
