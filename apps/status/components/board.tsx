"use client";

import { Activity, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { useKey } from "@/components/keys";
import { Ago } from "@/components/time";
import { createMonitor, refreshMonitors, removeMonitor, saveLabel } from "@/lib/actions";
import { reduceMonitors, statusLine, type Monitor } from "@/lib/list-state";

export function Board({ items, signedIn }: { items: Monitor[] | null; signedIn: boolean }) {
  const list = items ?? [];
  const [optimistic, apply] = useOptimistic(list, reduceMonitors);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const focusLink = useCallback(() => linkRef.current?.focus(), []);
  const refresh = useCallback(() => {
    setError(null);
    setChecking(true);
    startTransition(async () => {
      const result = await refreshMonitors();
      setChecking(false);
      if (result.error) setError(result.error);
    });
  }, [startTransition]);
  useKey("c", focusLink);
  useKey("r", refresh);

  return (
    <>
      <form
        ref={formRef}
        className="composer"
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
                item: { id: crypto.randomUUID(), url: url.href, label, ok: null, statusCode: null, latencyMs: null, error: null, at: new Date().toISOString() },
              });
            }
            const result = await createMonitor({}, form);
            if (result.error) setError(result.error);
            else formRef.current?.reset();
          });
        }}
      >
        <div className="composer-head">
          <span>New check</span>
          <span className="row-actions">
            <kbd>C</kbd>
            <kbd>R</kbd>
          </span>
        </div>
        <div className="composer-line">
          <label className="field">
            <span>URL</span>
            <input ref={linkRef} name="url" type="text" inputMode="url" placeholder="https://" autoComplete="off" autoCapitalize="off" autoCorrect="off" required maxLength={2000} spellCheck={false} />
          </label>
          <label className="field">
            <span>Label</span>
            <input name="label" type="text" placeholder="Optional" maxLength={120} />
          </label>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="composer-line">
          <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending && !checking ? "Saving" : "Save"}
          </button>
          <button className="ghost" type="button" disabled={pending} onClick={refresh}>
            <RefreshCw size={15} strokeWidth={1.5} aria-hidden="true" />
            {checking ? "Checking" : "Refresh"}
          </button>
        </div>
      </form>
      <section className="list">
        {signedIn && items && optimistic.length === 0 ? (
          <div className="empty">
            <Activity size={18} strokeWidth={1.5} aria-hidden="true" />
            <strong>No URLs</strong>
          </div>
        ) : null}
        {optimistic.map((item) => {
          const state = item.ok === true ? "up" : item.ok === false || item.error ? "down" : "";
          return (
            <article key={item.id} className="row-item">
              <span className={state ? `dot ${state}` : "dot"} aria-hidden="true" />
              <div className="row-main">
                <div className="row-top">
                  <h2>{item.label}</h2>
                  <Ago at={item.at} />
                </div>
                <p className="mono dim">{item.url.replace(/^https?:\/\//, "")}</p>
                {statusLine(item, checking) ? <p className="mono">{statusLine(item, checking)}</p> : null}
                <MonitorActions item={item} onDelete={(id) => apply({ type: "delete", id })} onEdit={(id, label) => apply({ type: "edit", id, label })} />
              </div>
            </article>
          );
        })}
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
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <div className="row-actions">
        <button className="icon-btn" type="button" aria-label="Edit" onClick={() => setEditing((open) => !open)}>
          <Pencil size={15} strokeWidth={1.5} />
        </button>
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
          <button className="icon-btn" type="submit" aria-label="Delete" disabled={pending}>
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        </form>
      </div>
      {editing ? (
        <form
          className="edit"
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
              else setEditing(false);
            });
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <label className="field">
            <span>Label</span>
            <input name="label" type="text" required maxLength={120} defaultValue={item.label} />
          </label>
          <div>
            <button className="ghost" type="submit" disabled={pending}>
              {pending ? "Saving" : "Update"}
            </button>
          </div>
        </form>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
