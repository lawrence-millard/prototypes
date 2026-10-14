"use client";

import { ListChecks, Pencil, Trash2 } from "lucide-react";
import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { CopyLink } from "@/components/copy-link";
import { useKey } from "@/components/keys";
import { Ago } from "@/components/time";
import { createPoll, removePoll, saveQuestion, toggleClosed } from "@/lib/actions";
import { reducePolls, type PollItem } from "@/lib/list-state";
import { cleanOptions, questionSchema } from "@/lib/schemas";

export function Board({ items, signedIn }: { items: PollItem[] | null; signedIn: boolean }) {
  const list = items ?? [];
  const [optimistic, apply] = useOptimistic(list, reducePolls);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState(2);
  const formRef = useRef<HTMLFormElement>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const focusQuestion = useCallback(() => questionRef.current?.focus(), []);
  useKey("c", focusQuestion);

  return (
    <>
      <form
        ref={formRef}
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const question = questionSchema.safeParse(form.get("question"));
          const options = cleanOptions(form.getAll("option").map(String));
          if (!question.success) {
            setError(question.error.issues[0]?.message ?? "Add a question.");
            return;
          }
          if (!options.ok) {
            setError(options.error);
            return;
          }
          setError(null);
          startTransition(async () => {
            if (signedIn) apply({ type: "add", item: { id: crypto.randomUUID(), question: question.data, closed: false, votes: 0, createdAt: new Date().toISOString() } });
            const result = await createPoll({}, form);
            if (result.error) setError(result.error);
            else {
              formRef.current?.reset();
              setCount(2);
            }
          });
        }}
      >
        <div className="composer-head">
          <span>New poll</span>
          <kbd>C</kbd>
        </div>
        <label className="field">
          <span>Question</span>
          <input ref={questionRef} name="question" type="text" placeholder="Ask something" required maxLength={140} />
        </label>
        {Array.from({ length: count }, (_, index) => (
          <div className="option" key={index}>
            <span className="idx" aria-hidden="true">
              {index + 1}
            </span>
            <label className="field">
              <span className="sr-only">Option {index + 1}</span>
              <input name="option" type="text" placeholder="Add a choice" maxLength={80} />
            </label>
          </div>
        ))}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="composer-line">
          {count < 6 ? (
            <button className="ghost" type="button" onClick={() => setCount((value) => Math.min(6, value + 1))}>
              Add option
            </button>
          ) : null}
          <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving" : "Create"}
          </button>
        </div>
      </form>
      <section className="list">
        {signedIn && items && optimistic.length === 0 ? (
          <div className="empty">
            <ListChecks size={18} strokeWidth={1.5} aria-hidden="true" />
            <strong>No polls</strong>
          </div>
        ) : null}
        {optimistic.map((poll) => (
          <article key={poll.id} className="row-item">
            <ListChecks className="ico" size={16} strokeWidth={1.5} aria-hidden="true" />
            <div className="row-main">
              <div className="row-top">
                <h2>
                  <a href={`/p/${poll.id}`}>{poll.question}</a>
                </h2>
                <Ago at={poll.createdAt} />
              </div>
              <p className="mono dim">
                {poll.votes} {poll.votes === 1 ? "vote" : "votes"}
                {poll.closed ? " · closed" : ""}
              </p>
              <PollActions poll={poll} onApply={apply} />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function PollActions({ poll, onApply }: { poll: PollItem; onApply: (action: Parameters<typeof reducePolls>[1]) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <div className="row-actions">
      <CopyLink path={`/p/${poll.id}`} />
      <button className="icon-btn" type="button" aria-label="Edit" onClick={() => setEditing((open) => !open)}>
        <Pencil size={15} strokeWidth={1.5} />
      </button>
      <form
        action={(form) => {
          setError(null);
          startTransition(async () => {
            onApply({ type: "delete", id: poll.id });
            const result = await removePoll({}, form);
            if (result.error) setError(result.error);
          });
        }}
      >
        <input type="hidden" name="id" value={poll.id} />
        <button className="icon-btn" type="submit" aria-label="Delete" disabled={pending}>
          <Trash2 size={15} strokeWidth={1.5} />
        </button>
      </form>
      <form
        action={(form) => {
          setError(null);
          const closed = String(form.get("closed")) === "true";
          startTransition(async () => {
            onApply({ type: "close", id: poll.id, closed });
            const result = await toggleClosed({}, form);
            if (result.error) setError(result.error);
          });
        }}
      >
        <input type="hidden" name="id" value={poll.id} />
        <input type="hidden" name="closed" value={poll.closed ? "false" : "true"} />
        <button className="textish" type="submit" disabled={pending}>
          {poll.closed ? "Open" : "Close"}
        </button>
      </form>
      </div>
      {editing ? (
        <form
          className="edit"
          action={(form) => {
            const question = questionSchema.safeParse(form.get("question"));
            if (!question.success) {
              setError(question.error.issues[0]?.message ?? "Add a question.");
              return;
            }
            setError(null);
            startTransition(async () => {
              onApply({ type: "edit", id: poll.id, question: question.data });
              const result = await saveQuestion({}, form);
              if (result.error) setError(result.error);
              else setEditing(false);
            });
          }}
        >
          <input type="hidden" name="id" value={poll.id} />
          <label className="field">
            <span>Question</span>
            <input name="question" type="text" required maxLength={140} defaultValue={poll.question} />
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
