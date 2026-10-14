"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addExpense, addMember, removeExpense, removeGroup, removeMember, saveExpense, saveGroupName } from "@/lib/actions";
import { balances, formatCents, parseCents, settle } from "@/lib/money";
import type { GroupView } from "@/lib/queries";

export function GroupBoard({ group }: { group: GroupView }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const names = useMemo(() => new Map(group.members.map((member) => [member.id, member.name])), [group.members]);
  const nets = balances(
    group.members.map((member) => member.id),
    group.expenses.map((expense) => ({ payerId: expense.payerId, amount: expense.amount, shares: expense.shares })),
  );
  const transfers = settle([...nets].map(([id, cents]) => ({ id, cents })));

  return (
    <>
      <form
        className="stack"
        action={(form) => {
          const name = String(form.get("name") ?? "").trim();
          if (!name) {
            setError("Add a name.");
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await saveGroupName({}, form);
            if (result.error) setError(result.error);
          });
        }}
      >
        <label>
          <span className="kicker">Group</span>
          <input name="name" type="text" required maxLength={40} defaultValue={group.name} />
        </label>
        <input type="hidden" name="id" value={group.id} />
        <div className="row">
          <button className="ghost" type="submit" disabled={pending}>
            Update
          </button>
          <button
            className="textish"
            type="button"
            onClick={() => {
              const form = new FormData();
              form.set("id", group.id);
              startTransition(async () => {
                const result = await removeGroup({}, form);
                if (result.error) setError(result.error);
                else router.push("/");
              });
            }}
          >
            Delete
          </button>
        </div>
      </form>

      <section className="section">
        <p className="kicker">People</p>
        {group.members.map((member) => (
          <div key={member.id} className="item">
            <div className="row">
              <span>{member.name}</span>
              <span className="mono">{formatCents(nets.get(member.id) ?? 0)}</span>
              <form
                action={(form) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await removeMember({}, form);
                    if (result.error) setError(result.error);
                  });
                }}
              >
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="memberId" value={member.id} />
                <button className="textish" type="submit">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        <form
          className="row section"
          action={(form) => {
            const name = String(form.get("name") ?? "").trim();
            if (!name) {
              setError("Add a name.");
              return;
            }
            setError(null);
            startTransition(async () => {
              const result = await addMember({}, form);
              if (result.error) setError(result.error);
            });
          }}
        >
          <input type="hidden" name="groupId" value={group.id} />
          <label className="sr-only" htmlFor="member-name">
            Name
          </label>
          <input id="member-name" name="name" type="text" maxLength={40} />
          <button className="ghost" type="submit" disabled={pending}>
            Add
          </button>
        </form>
      </section>

      <section className="section">
        <p className="kicker">Expenses</p>
        {group.expenses.map((expense) => (
          <article key={expense.id} className="item">
            <h2>{expense.memo}</h2>
            <p className="mono">
              {names.get(expense.payerId)} paid {formatCents(expense.amount)}
            </p>
            <div className="actions">
              <form
                action={(form) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await removeExpense({}, form);
                    if (result.error) setError(result.error);
                  });
                }}
              >
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="expenseId" value={expense.id} />
                <button className="textish" type="submit">
                  Delete
                </button>
              </form>
            </div>
            <details>
              <summary>Edit</summary>
              <form
                className="stack edit"
                action={(form) => {
                  if (parseCents(String(form.get("amount") ?? "")) === null) {
                    setError("Enter an amount.");
                    return;
                  }
                  setError(null);
                  startTransition(async () => {
                    const result = await saveExpense({}, form);
                    if (result.error) setError(result.error);
                  });
                }}
              >
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="expenseId" value={expense.id} />
                <label>
                  <span className="kicker">Memo</span>
                  <input name="memo" type="text" required maxLength={80} defaultValue={expense.memo} />
                </label>
                <label>
                  <span className="kicker">Amount</span>
                  <input name="amount" type="text" inputMode="decimal" required defaultValue={formatCents(expense.amount)} />
                </label>
                <div>
                  <button className="ghost" type="submit" disabled={pending}>
                    Update
                  </button>
                </div>
              </form>
            </details>
          </article>
        ))}
        {group.members.length > 0 ? (
          <form
            className="stack section"
            action={(form) => {
              if (parseCents(String(form.get("amount") ?? "")) === null) {
                setError("Enter an amount.");
                return;
              }
              if (form.getAll("memberId").length === 0) {
                setError("Pick who shares.");
                return;
              }
              setError(null);
              startTransition(async () => {
                const result = await addExpense({}, form);
                if (result.error) setError(result.error);
              });
            }}
          >
            <input type="hidden" name="groupId" value={group.id} />
            <label>
              <span className="kicker">Memo</span>
              <input name="memo" type="text" required maxLength={80} />
            </label>
            <label>
              <span className="kicker">Amount</span>
              <input name="amount" type="text" inputMode="decimal" required />
            </label>
            <label>
              <span className="kicker">Paid by</span>
              <select name="payerId" defaultValue={group.members[0]?.id}>
                {group.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="checks">
              {group.members.map((member) => (
                <label key={member.id} className="check">
                  <input type="checkbox" name="memberId" value={member.id} defaultChecked />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
            <div>
              <button className="primary" type="submit" disabled={pending}>
                {pending ? "Saving" : "Add"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {group.expenses.length > 0 ? (
        <section className="section">
          <p className="kicker">Settle</p>
          {transfers.length === 0 ? <p>Settled.</p> : null}
          {transfers.map((transfer) => (
            <p key={`${transfer.fromId}-${transfer.toId}`} className="mono">
              {names.get(transfer.fromId)} pays {names.get(transfer.toId)} {formatCents(transfer.cents)}
            </p>
          ))}
        </section>
      ) : null}
      {error ? (
        <p className="error section" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
