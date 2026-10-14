import assert from "node:assert/strict";
import test from "node:test";
import { balances, equalShares, formatCents, parseCents, settle } from "../lib/money.ts";
import { safeNext } from "../lib/redirect.ts";

test("parses and formats amounts", () => {
  assert.equal(parseCents("12.5"), 1250);
  assert.equal(parseCents("0"), null);
  assert.equal(parseCents("10.999"), null);
  assert.equal(parseCents("1000000.00"), 100_000_000);
  assert.equal(parseCents("1000000.01"), null);
  assert.equal(formatCents(-1250), "-12.50");
  assert.equal(formatCents(5), "0.05");
});

test("splits the remainder in cents and settles", () => {
  assert.deepEqual(equalShares(1000, 3), [334, 333, 333]);
  const members = ["a", "b", "c"];
  const expenses = [
    {
      payerId: "a",
      amount: 3000,
      shares: [
        { memberId: "a", amount: 1000 },
        { memberId: "b", amount: 1000 },
        { memberId: "c", amount: 1000 },
      ],
    },
  ];
  const net = balances(members, expenses);
  assert.equal(net.get("a"), 2000);
  assert.equal(net.get("b"), -1000);
  const transfers = settle([...net].map(([id, cents]) => ({ id, cents })));
  assert.deepEqual(transfers, [
    { fromId: "b", toId: "a", cents: 1000 },
    { fromId: "c", toId: "a", cents: 1000 },
  ]);
  assert.deepEqual(settle([{ id: "a", cents: 0 }, { id: "b", cents: 0 }]), []);
});

test("group links stay on this app", () => {
  const id = "00000000-0000-4000-8000-000000000000";
  assert.equal(safeNext(`/g/${id}`, "group"), `/g/${id}`);
  assert.equal(safeNext(`https://split.vercel.app/g/${id}`, "group"), "/");
  assert.equal(safeNext("/g/not-an-id", "group"), "/");
});
