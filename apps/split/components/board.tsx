"use client";

import { Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { useKey } from "@/components/keys";
import { Ago } from "@/components/time";
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
  const nameRef = useRef<HTMLInputElement>(null);
  const focusName = useCallback(() => nameRef.current?.focus(), []);
  useKey("c", focusName);
  const router = useRouter();

  return (
    <>
      <form
        ref={formRef}
        className="composer"
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
            if (signedIn) apply({ type: "add", item: { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() } });
            const result = await createGroup({}, form);
            if (result.error) setError(result.error);
            else if (result.id) router.push(`/g/${result.id}`);
          });
        }}
      >
        <div className="composer-head">
          <span>New group</span>
          <kbd>C</kbd>
        </div>
        <div className="composer-line">
          <label className="field">
            <span>Group</span>
            <input ref={nameRef} name="name" type="text" placeholder="Trip" required maxLength={40} />
          </label>
          <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving" : "Create"}
          </button>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      <section className="list">
        {signedIn && items && optimistic.length === 0 ? (
          <div className="empty">
            <Users size={18} strokeWidth={1.5} aria-hidden="true" />
            <strong>No groups</strong>
          </div>
        ) : null}
        {optimistic.map((group) => (
          <article key={group.id} className="row-item">
            <Users className="ico" size={16} strokeWidth={1.5} aria-hidden="true" />
            <div className="row-main">
              <div className="row-top">
                <h2>
                  <a href={`/g/${group.id}`}>{group.name}</a>
                </h2>
                <Ago at={group.createdAt} />
              </div>
              <form
                className="row-actions"
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
                <button className="icon-btn" type="submit" aria-label="Delete">
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
