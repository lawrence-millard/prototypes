"use client";

import { useRef, useState, useTransition, useOptimistic } from "react";
import { createBookmark, removeBookmark, saveBookmark } from "@/lib/actions";
import { reduceBookmarks, type Bookmark } from "@/lib/list-state";
import { hostLabel, normalizeHttpUrl } from "@/lib/url";

export function Board({
  items,
  tags,
  active,
  signedIn,
}: {
  items: Bookmark[] | null;
  tags: string[];
  active: string | null;
  signedIn: boolean;
}) {
  const list = items ?? [];
  const [optimistic, apply] = useOptimistic(list, reduceBookmarks);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        ref={formRef}
        className="stack"
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
            if (signedIn) apply({ type: "add", item: { id: crypto.randomUUID(), url, title, tags } });
            const result = await createBookmark({}, form);
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
          <span className="kicker">Title</span>
          <input name="title" type="text" maxLength={120} />
        </label>
        <label>
          <span className="kicker">Tags</span>
          <input name="tags" type="text" maxLength={200} autoComplete="off" />
        </label>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving" : "Save"}
          </button>
        </div>
      </form>
      {tags.length > 0 ? (
        <div className="tags section">
          <a className={active ? "tag" : "tag on"} href="/" aria-current={active ? undefined : "page"}>
            all
          </a>
          {tags.map((name) => (
            <a key={name} className={name === active ? "tag on" : "tag"} href={`/?tag=${encodeURIComponent(name)}`} aria-current={name === active ? "page" : undefined}>
              {name}
            </a>
          ))}
        </div>
      ) : null}
      <section className="section">
        {signedIn && items && optimistic.length === 0 ? <p className="dim">No bookmarks.</p> : null}
        {optimistic.map((bookmark) => (
          <article key={bookmark.id} className="item">
            <h2>{bookmark.title}</h2>
            <a className="mono dim" href={bookmark.url} rel="noreferrer noopener">
              {bookmark.url}
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
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onEdit: (item: Bookmark) => void;
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
              onDelete(bookmark.id);
              const result = await removeBookmark({}, form);
              if (result.error) setError(result.error);
            });
          }}
        >
          <input type="hidden" name="id" value={bookmark.id} />
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
            });
          }}
        >
          <input type="hidden" name="id" value={bookmark.id} />
          <label>
            <span className="kicker">Title</span>
            <input name="title" type="text" required maxLength={120} defaultValue={bookmark.title} />
          </label>
          <label>
            <span className="kicker">Tags</span>
            <input name="tags" type="text" maxLength={200} defaultValue={bookmark.tags.join(", ")} autoComplete="off" />
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
