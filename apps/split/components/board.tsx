"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { createGroup, removeGroup } from "@/lib/actions";
import type { GroupItem } from "@/lib/queries";

export function Board({ items, signedIn }: { items: GroupItem[] | null; signedIn: boolean }) {
  const list = items ?? [];
  const [optimistic, apply] = useOptimistic(list, (state: GroupItem[], action: { type: "add"; item: GroupItem } | { type: "delete"; id: string }) => {
    if (action.type === "add") return [action.item, ...state.filter((item) => item.id !== action.item.id)];
    return state.filter((item) => item.id !== action.id);
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <>
      <form
        ref={formRef}
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const name = String(form.get("name") ?? "").trim();
          if (!name) {
            setError("Add a name.");
            return;
          }
          setError(null);
          startTransition(async () => {
            if (signedIn) apply({ type: "add", item: { id: crypto.randomUUID(), name } });
            const result = await createGroup({}, form);
            if (result.error) setError(result.error);
            else if (result.id) router.push(`/g/${result.id}`);
          });
        }}
      >
        <label>
          <span className="kicker">Group</span>
          <input name="name" type="text" required maxLength={40} />
        </label>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving" : "Create"}
          </button>
        </div>
      </form>
      <section className="section">
        {signedIn && items && optimistic.length === 0 ? <p className="dim">No groups.</p> : null}
        {optimistic.map((group) => (
          <article key={group.id} className="item">
            <h2>
              <a href={`/g/${group.id}`}>{group.name}</a>
            </h2>
            <form
              action={(form) => {
                setError(null);
                startTransition(async () => {
                  apply({ type: "delete", id: group.id });
                  const result = await removeGroup({}, form);
                  if (result.error) setError(result.error);
                });
              }}
            >
              <input type="hidden" name="id" value={group.id} />
              <button className="textish" type="submit">
                Delete
              </button>
            </form>
          </article>
        ))}
      </section>
    </>
  );
}
