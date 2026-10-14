import assert from "node:assert/strict";
import test from "node:test";
import { reducePolls, reduceVote } from "../lib/list-state.ts";
import { safeNext } from "../lib/redirect.ts";
import { cleanOptions, questionSchema } from "../lib/schemas.ts";

test("options need two and no more than six", () => {
  assert.equal(cleanOptions(["  Yes ", "", "No"]).ok, true);
  assert.equal(cleanOptions(["Only"]).ok, false);
  assert.equal(cleanOptions(["a", "b", "c", "d", "e", "f", "g"]).ok, false);
  assert.equal(questionSchema.safeParse("  Ship it? ").success, true);
  assert.equal(questionSchema.safeParse("").success, false);
});

test("one vote sticks and a second choice is ignored", () => {
  const start = [
    { id: "a", label: "A", votes: 1, mine: false },
    { id: "b", label: "B", votes: 0, mine: false },
  ];
  const once = reduceVote(start, "b");
  assert.equal(once.find((item) => item.id === "b")?.votes, 1);
  assert.equal(once.find((item) => item.id === "b")?.mine, true);
  const twice = reduceVote(once, "a");
  assert.equal(twice.find((item) => item.id === "a")?.votes, 1);
  assert.equal(twice.find((item) => item.id === "b")?.mine, true);
});

test("poll list edits and public links stay on this app", () => {
  const start = [{ id: "1", question: "Q", closed: false, votes: 0 }];
  assert.equal(reducePolls(start, { type: "close", id: "1", closed: true })[0]?.closed, true);
  assert.equal(reducePolls(start, { type: "edit", id: "1", question: "Q2" })[0]?.question, "Q2");
  assert.equal(reducePolls(start, { type: "delete", id: "1" }).length, 0);
  const id = "00000000-0000-4000-8000-000000000000";
  assert.equal(safeNext(`/p/${id}`, "poll"), `/p/${id}`);
  assert.equal(safeNext("https://poll.vercel.app/p/" + id, "poll"), "/");
  assert.equal(safeNext("https://poll.millard.ink/p/" + id, "poll"), "/");
});
