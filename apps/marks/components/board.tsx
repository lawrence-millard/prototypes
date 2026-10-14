"use client";

import { Bookmark, Pencil, Trash2 } from "lucide-react";
import { useRef, useState, useTransition, useOptimistic, useCallback } from "react";
import { useKey } from "@/components/keys";
import { Ago } from "@/components/time";
import { createBookmark, removeBookmark, saveBookmark } from "@/lib/actions";
import { reduceBookmarks, type Bookmark as Mark } from "@/lib/list-state";
import { hostLabel, normalizeHttpUrl } from "@/lib/url";

export function Board({
  items,
  tags,
  active,
  signedIn,
}: {
  items: Mark[] | null;
  tags: string[];
  active: string | null;
  signedIn: boolean;
}) {
  const list = items ?? [];
  const [optimistic, apply] = useOptimistic(list, reduceBookmarks);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const focusLink = useCallback(() => linkRef.current?.focus(), []);
  useKey("c", focusLink);

  return (
    <>
      <form
        ref={formRef}
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const url = normalizeHttpUrl(String(form.get("url") ?? ""));
          if (!url) {
            setError("Enter an http or https URL.");
            return;
          }
          const title = String(form.get("title") ?? "").trim() || hostLabel(url);
          setError(null);
          const tags = String(form.get("tags") ?? "")
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean);
          startTransition(async () => {
            if (signedIn) apply({ type: "add", item: { id: crypto.randomUUID(), url, title, tags, createdAt: new Date().toISOString() } });
            const result = await createBookmark({}, form);
            if (result.error) setError(result.error);
            else formRef.current?.reset();
          });
        }}
      >
        <div className="composer-head">
          <span>New link</span>
          <kbd>C</kbd>
        </div>
        <div className="composer-line">
          <label className="field">
            <span>Link</span>
            <input ref={linkRef} name="url" type="text" inputMode="url" placeholder="https://" autoComplete="off" autoCapitalize="off" autoCorrect="off" required maxLength={2000} spellCheck={false} />
          </label>
          <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving" : "Save"}
          </button>
        </div>
        <div className="composer-line">
          <label className="field">
            <span>Title</span>
            <input name="title" type="text" placeholder="Optional" maxLength={120} />
          </label>
          <label className="field">
            <span>Tags</span>
            <input name="tags" type="text" placeholder="read, work" maxLength={200} autoComplete="off" />
          </label>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      {tags.length > 0 ? (
        <div className="tags filters">
          <a className={active ? "tag" : "tag on"} href="/" aria-current={active ? undefined : "page"}>
            All
          </a>
          {tags.map((name) => (
            <a key={name} className={name === active ? "tag on" : "tag"} href={`/?tag=${encodeURIComponent(name)}`} aria-current={name === active ? "page" : undefined}>
              {name}
            </a>
          ))}
        </div>
      ) : null}
      <section className="list">
        {signedIn && items && optimistic.length === 0 ? (
          <div className="empty">
            <Bookmark size={18} strokeWidth={1.5} aria-hidden="true" />
            <strong>No bookmarks</strong>
          </div>
        ) : null}
        {optimistic.map((bookmark) => (
          <article key={bookmark.id} className="row-item">
            <Bookmark className="ico" size={16} strokeWidth={1.5} aria-hidden="true" />
            <div className="row-main">
              <div className="row-top">
                <h2>{bookmark.title}</h2>
                <Ago at={bookmark.createdAt} />
              </div>
              <a className="mono dim" href={bookmark.url} rel="noreferrer noopener">
                {bookmark.url.replace(/^https?:\/\//, "")}
              </a>
              {bookmark.tags.length > 0 ? (
                <div className="tags">
                  {bookmark.tags.map((name) => (
                    <a key={name} className="tag" href={`/?tag=${encodeURIComponent(name)}`}>
                      {name}
                    </a>
                  ))}
                </div>
              ) : null}
              <BookmarkActions bookmark={bookmark} onDelete={(id) => apply({ type: "delete", id })} onEdit={(item) => apply({ type: "edit", item })} />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function BookmarkActions({
  bookmark,
  onDelete,
  onEdit,
}: {
  bookmark: Mark;
  onDelete: (id: string) => void;
  onEdit: (item: Mark) => void;
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
              onDelete(bookmark.id);
              const result = await removeBookmark({}, form);
              if (result.error) setError(result.error);
            });
          }}
        >
          <input type="hidden" name="id" value={bookmark.id} />
          <button className="icon-btn" type="submit" aria-label="Delete" disabled={pending}>
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        </form>
      </div>
      {editing ? (
        <form
          className="edit"
          action={(form) => {
            const title = String(form.get("title") ?? "").trim();
            const tags = String(form.get("tags") ?? "")
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
              .filter(Boolean);
            if (!title) {
              setError("Add a title.");
              return;
            }
            setError(null);
            startTransition(async () => {
              onEdit({ ...bookmark, title, tags });
              const result = await saveBookmark({}, form);
              if (result.error) setError(result.error);
              else setEditing(false);
            });
          }}
        >
          <input type="hidden" name="id" value={bookmark.id} />
          <label className="field">
            <span>Title</span>
            <input name="title" type="text" required maxLength={120} defaultValue={bookmark.title} />
          </label>
          <label className="field">
            <span>Tags</span>
            <input name="tags" type="text" placeholder="read, work" maxLength={200} defaultValue={bookmark.tags.join(", ")} autoComplete="off" />
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
