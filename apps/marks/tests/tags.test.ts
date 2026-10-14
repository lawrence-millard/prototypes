import assert from "node:assert/strict";
import test from "node:test";
import { reduceBookmarks } from "../lib/list-state.ts";
import { safeNext } from "../lib/redirect.ts";
import { parseTags } from "../lib/tags.ts";
import { hostLabel, normalizeHttpUrl } from "../lib/url.ts";

test("parseTags keeps letters, numbers, and dashes", () => {
  assert.deepEqual(parseTags(" Work, read, work "), { ok: true, tags: ["work", "read"] });
  assert.equal(parseTags("").ok, true);
  assert.equal(parseTags("a").ok, true);
  assert.equal(parseTags("has space").ok, false);
  assert.equal(parseTags("one,two,three,four,five,six,seven,eight,nine").ok, false);
});

test("normalizeHttpUrl accepts public http(s) links", () => {
  assert.equal(normalizeHttpUrl("https://example.com/a#x"), "https://example.com/a");
  assert.equal(normalizeHttpUrl("notaurl"), null);
  assert.equal(normalizeHttpUrl("javascript:alert(1)"), null);
  assert.equal(normalizeHttpUrl("https://user:pass@example.com"), null);
  assert.equal(hostLabel("https://www.example.com/a"), "example.com");
});

test("safeNext rejects off-site targets", () => {
  assert.equal(safeNext("/"), "/");
  assert.equal(safeNext("https://marks.millard.ink"), "/");
  assert.equal(safeNext("https://evil.example"), "/");
  assert.equal(safeNext("//evil.example"), "/");
  assert.equal(safeNext("https://marks.vercel.app"), "/");
  assert.equal(safeNext("/p/00000000-0000-4000-8000-000000000000", "none"), "/");
  assert.equal(safeNext("/p/00000000-0000-4000-8000-000000000000", "poll"), "/p/00000000-0000-4000-8000-000000000000");
});

test("reduceBookmarks adds, edits, and deletes", () => {
  const start = [{ id: "1", url: "https://a.example", title: "A", tags: ["a"] }];
  const added = reduceBookmarks(start, { type: "add", item: { id: "2", url: "https://b.example", title: "B", tags: [] } });
  assert.deepEqual(added.map((item) => item.id), ["2", "1"]);
  const edited = reduceBookmarks(added, { type: "edit", item: { id: "1", url: "https://a.example", title: "A2", tags: ["b"] } });
  assert.equal(edited.find((item) => item.id === "1")?.title, "A2");
  assert.deepEqual(
    reduceBookmarks(edited, { type: "delete", id: "2" }).map((item) => item.id),
    ["1"],
  );
});
