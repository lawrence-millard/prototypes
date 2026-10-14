"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { createPoll, removePoll, saveQuestion, toggleClosed } from "@/lib/actions";
import { CopyLink } from "@/components/copy-link";
import { reducePolls, type PollItem } from "@/lib/list-state";
import { cleanOptions, questionSchema } from "@/lib/schemas";

export function Board({ items, signedIn }: { items: PollItem[] | null; signedIn: boolean }) {
  const list = items ?? [];
  const [optimistic, apply] = useOptimistic(list, reducePolls);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState(2);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        ref={formRef}
        className="stack"
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
            if (signedIn) apply({ type: "add", item: { id: crypto.randomUUID(), question: question.data, closed: false, votes: 0 } });
            const result = await createPoll({}, form);
            if (result.error) setError(result.error);
            else {
              formRef.current?.reset();
              setCount(2);
            }
          });
        }}
      >
        <label>
          <span className="kicker">Question</span>
          <input name="question" type="text" required maxLength={140} />
        </label>
        {Array.from({ length: count }, (_, index) => (
          <label key={index}>
            <span className="kicker">Option {index + 1}</span>
            <input name="option" type="text" maxLength={80} />
          </label>
        ))}
        <div className="row">
          {count < 6 ? (
            <button className="ghost" type="button" onClick={() => setCount((value) => Math.min(6, value + 1))}>
              Add option
            </button>
          ) : null}
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
      <section className="section">
        {signedIn && items && optimistic.length === 0 ? <p className="dim">No polls.</p> : null}
        {optimistic.map((poll) => (
          <article key={poll.id} className="item">
            <h2>
              <a href={`/p/${poll.id}`}>{poll.question}</a>
            </h2>
            <p className="mono dim">
              {poll.votes} {poll.closed ? "· closed" : ""}
            </p>
            <p className="mono dim">/p/{poll.id}</p>
            <div className="actions">
              <CopyLink path={`/p/${poll.id}`} />
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
  const [pending, startTransition] = useTransition();
  return (
    <>
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
        <button className="textish" type="submit" disabled={pending}>
          Delete
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
      <details>
        <summary>Edit</summary>
        <form
          className="stack edit"
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
            });
          }}
        >
          <input type="hidden" name="id" value={poll.id} />
          <label>
            <span className="kicker">Question</span>
            <input name="question" type="text" required maxLength={140} defaultValue={poll.question} />
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
