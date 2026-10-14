"use client";

import { Pencil, Receipt, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useKey } from "@/components/keys";
import { Ago } from "@/components/time";
import { addExpense, addMember, removeExpense, removeGroup, removeMember, saveExpense, saveGroupName } from "@/lib/actions";
import { balances, formatCents, parseCents, settle } from "@/lib/money";
import type { GroupView } from "@/lib/queries";

export function GroupBoard({ group }: { group: GroupView }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const memberRef = useRef<HTMLInputElement>(null);
  const focusMember = useCallback(() => memberRef.current?.focus(), []);
  useKey("c", focusMember);
  const names = useMemo(() => new Map(group.members.map((member) => [member.id, member.name])), [group.members]);
  const nets = balances(
    group.members.map((member) => member.id),
    group.expenses.map((expense) => ({ payerId: expense.payerId, amount: expense.amount, shares: expense.shares })),
  );
  const transfers = settle([...nets].map(([id, cents]) => ({ id, cents })));

  return (
    <>
      <div className="block">
        <div className="row-top">
          {editing ? (
            <form
              className="composer-line"
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
                  else setEditing(false);
                });
              }}
            >
              <label className="field">
                <span className="sr-only">Group</span>
                <input name="name" type="text" required maxLength={40} defaultValue={group.name} />
              </label>
              <input type="hidden" name="id" value={group.id} />
              <button className="ghost" type="submit" disabled={pending}>
                Update
              </button>
            </form>
          ) : (
            <h2>{group.name}</h2>
          )}
          <div className="row-actions">
            <button className="icon-btn" type="button" aria-label="Edit" onClick={() => setEditing((open) => !open)}>
              <Pencil size={15} strokeWidth={1.5} />
            </button>
            <button
              className="icon-btn"
              type="button"
              aria-label="Delete"
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
              <Trash2 size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <section className="block">
        <h2>People</h2>
        <div className="list">
          {group.members.length === 0 ? (
            <div className="empty">
              <UserRound size={18} strokeWidth={1.5} aria-hidden="true" />
              <strong>No people</strong>
            </div>
          ) : null}
          {group.members.map((member) => (
            <div key={member.id} className="row-item">
              <UserRound className="ico" size={16} strokeWidth={1.5} aria-hidden="true" />
              <div className="row-main">
                <div className="row-top">
                  <h2>{member.name}</h2>
                  <span className="mono">{formatCents(nets.get(member.id) ?? 0)}</span>
                </div>
                <form
                  className="row-actions"
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
                  <button className="icon-btn" type="submit" aria-label="Delete">
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <form
          className="composer"
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
          <div className="composer-head">
            <span>Add a person</span>
            <kbd>C</kbd>
          </div>
          <div className="composer-line">
            <label className="field">
              <span>Name</span>
              <input ref={memberRef} name="name" type="text" placeholder="Ada" maxLength={40} />
            </label>
            <input type="hidden" name="groupId" value={group.id} />
            <button className="primary" type="submit" disabled={pending}>
              Add
            </button>
          </div>
        </form>
      </section>

      <section className="block">
        <h2>Expenses</h2>
        <div className="list">
          {group.expenses.length === 0 ? (
            <div className="empty">
              <Receipt size={18} strokeWidth={1.5} aria-hidden="true" />
              <strong>No expenses</strong>
            </div>
          ) : null}
          {group.expenses.map((expense) => (
            <ExpenseRow key={expense.id} groupId={group.id} expense={expense} payer={names.get(expense.payerId) ?? ""} setError={setError} />
          ))}
        </div>
        {group.members.length > 0 ? (
          <form
            className="composer"
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
            <div className="composer-head">
              <span>New expense</span>
            </div>
            <div className="composer-line">
              <label className="field">
                <span>Memo</span>
                <input name="memo" type="text" placeholder="Dinner" required maxLength={80} />
              </label>
              <label className="field">
                <span>Amount</span>
                <input name="amount" type="text" inputMode="decimal" placeholder="0.00" required />
              </label>
            </div>
            <label className="field">
              <span>Paid by</span>
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
            <input type="hidden" name="groupId" value={group.id} />
            <div>
              <button className="primary" type="submit" disabled={pending}>
                {pending ? "Saving" : "Add"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {group.expenses.length > 0 ? (
        <section className="block">
          <h2>Settle</h2>
          {transfers.length === 0 ? <p>Settled.</p> : null}
          <div className="list">
            {transfers.map((transfer) => (
              <p key={`${transfer.fromId}-${transfer.toId}`} className="mono">
                {names.get(transfer.fromId)} pays {names.get(transfer.toId)} {formatCents(transfer.cents)}
              </p>
            ))}
          </div>
        </section>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

function ExpenseRow({
  groupId,
  expense,
  payer,
  setError,
}: {
  groupId: string;
  expense: GroupView["expenses"][number];
  payer: string;
  setError: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <article className="row-item">
      <Receipt className="ico" size={16} strokeWidth={1.5} aria-hidden="true" />
      <div className="row-main">
        <div className="row-top">
          <h2>{expense.memo}</h2>
          <Ago at={expense.createdAt} />
        </div>
        <p className="mono dim">
          {payer} paid {formatCents(expense.amount)}
        </p>
        <div className="row-actions">
          <button className="icon-btn" type="button" aria-label="Edit" onClick={() => setEditing((open) => !open)}>
            <Pencil size={15} strokeWidth={1.5} />
          </button>
          <form
            action={(form) => {
              setError(null);
              startTransition(async () => {
                const result = await removeExpense({}, form);
                if (result.error) setError(result.error);
              });
            }}
          >
            <input type="hidden" name="groupId" value={groupId} />
            <input type="hidden" name="expenseId" value={expense.id} />
            <button className="icon-btn" type="submit" aria-label="Delete">
              <Trash2 size={15} strokeWidth={1.5} />
            </button>
          </form>
        </div>
        {editing ? (
          <form
            className="edit"
            action={(form) => {
              if (parseCents(String(form.get("amount") ?? "")) === null) {
                setError("Enter an amount.");
                return;
              }
              setError(null);
              startTransition(async () => {
                const result = await saveExpense({}, form);
                if (result.error) setError(result.error);
                else setEditing(false);
              });
            }}
          >
            <input type="hidden" name="groupId" value={groupId} />
            <input type="hidden" name="expenseId" value={expense.id} />
            <label className="field">
              <span>Memo</span>
              <input name="memo" type="text" required maxLength={80} defaultValue={expense.memo} />
            </label>
            <label className="field">
              <span>Amount</span>
              <input name="amount" type="text" inputMode="decimal" required defaultValue={formatCents(expense.amount)} />
            </label>
            <div>
              <button className="ghost" type="submit" disabled={pending}>
                Update
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </article>
  );
}
