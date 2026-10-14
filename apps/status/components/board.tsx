"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { createMonitor, refreshMonitors, removeMonitor, saveLabel } from "@/lib/actions";
import { reduceMonitors, statusLine, type Monitor } from "@/lib/list-state";

export function Board({ items, signedIn }: { items: Monitor[] | null; signedIn: boolean }) {
  const list = items ?? [];
  const [optimistic, apply] = useOptimistic(list, reduceMonitors);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        ref={formRef}
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const raw = String(form.get("url") ?? "").trim();
          let url: URL;
          try {
            url = new URL(raw);
          } catch {
            setError("Enter an http or https URL.");
            return;
          }
          if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
            setError("Enter an http or https URL.");
            return;
          }
          const label = String(form.get("label") ?? "").trim() || url.hostname.replace(/^www\./, "");
          setError(null);
          startTransition(async () => {
            if (signedIn) {
              apply({
                type: "add",
                item: { id: crypto.randomUUID(), url: url.href, label, ok: null, statusCode: null, latencyMs: null, error: null },
              });
            }
            const result = await createMonitor({}, form);
            if (result.error) setError(result.error);
            else formRef.current?.reset();
          });
        }}
      >
        <label>
          <span className="kicker">URL</span>
          <input name="url" type="text" inputMode="url" autoComplete="off" autoCapitalize="off" autoCorrect="off" required maxLength={2000} spellCheck={false} />
        </label>
        <label>
          <span className="kicker">Label</span>
          <input name="label" type="text" maxLength={120} />
        </label>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="row">
          <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending && !checking ? "Saving" : "Save"}
          </button>
          <button
            className="ghost"
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setChecking(true);
              startTransition(async () => {
                const result = await refreshMonitors();
                setChecking(false);
                if (result.error) setError(result.error);
              });
            }}
          >
            {checking ? "Checking" : "Refresh"}
          </button>
        </div>
      </form>
      <section className="section">
        {signedIn && items && optimistic.length === 0 ? <p className="dim">No URLs.</p> : null}
        {optimistic.map((item) => (
          <article key={item.id} className="item">
            <h2>{item.label}</h2>
            <p className="mono dim">{item.url}</p>
            {statusLine(item, checking) ? <p className="mono">{statusLine(item, checking)}</p> : null}
            <MonitorActions item={item} onDelete={(id) => apply({ type: "delete", id })} onEdit={(id, label) => apply({ type: "edit", id, label })} />
          </article>
        ))}
      </section>
    </>
  );
}

function MonitorActions({
  item,
  onDelete,
  onEdit,
}: {
  item: Monitor;
  onDelete: (id: string) => void;
  onEdit: (id: string, label: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <div className="actions">
        <form
          action={(form) => {
            setError(null);
            startTransition(async () => {
              onDelete(item.id);
              const result = await removeMonitor({}, form);
              if (result.error) setError(result.error);
            });
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <button className="textish" type="submit" disabled={pending}>
            Delete
          </button>
        </form>
      </div>
      <details>
        <summary>Edit</summary>
        <form
          className="stack edit"
          action={(form) => {
            const label = String(form.get("label") ?? "").trim();
            if (!label) {
              setError("Add a label.");
              return;
            }
            setError(null);
            startTransition(async () => {
              onEdit(item.id, label);
              const result = await saveLabel({}, form);
              if (result.error) setError(result.error);
            });
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <label>
            <span className="kicker">Label</span>
            <input name="label" type="text" required maxLength={120} defaultValue={item.label} />
          </label>
          <div>
            <button className="ghost" type="submit" disabled={pending}>
              {pending ? "Saving" : "Update"}
            </button>
          </div>
        </form>
      </details>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
