"use client";

import { useOptimistic, useState, useTransition } from "react";
import { vote } from "@/lib/actions";
import { CopyLink } from "@/components/copy-link";
import { reduceVote, type Choice } from "@/lib/list-state";

export function VoteForm({
  pollId,
  question,
  closed,
  options,
  signedIn,
}: {
  pollId: string;
  question: string;
  closed: boolean;
  options: Choice[];
  signedIn: boolean;
}) {
  const [optimistic, apply] = useOptimistic(options, reduceVote);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const voted = optimistic.some((option) => option.mine);
  const total = optimistic.reduce((sum, option) => sum + option.votes, 0);

  return (
    <>
      <h2>{question}</h2>
      <p className="mono dim">{total}</p>
      <form
        className="section"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const optionId = String(form.get("optionId") ?? "");
          if (!optionId) {
            setError("Pick one.");
            return;
          }
          setError(null);
          startTransition(async () => {
            if (signedIn) apply(optionId);
            const result = await vote({}, form);
            if (result.error) setError(result.error);
          });
        }}
      >
        <input type="hidden" name="pollId" value={pollId} />
        {optimistic.map((option) => (
          <label key={option.id} className="choice">
            <input type="radio" name="optionId" value={option.id} defaultChecked={option.mine} disabled={closed || voted || pending} />
            <span>{option.label}</span>
            <span className="mono">{option.votes}</span>
          </label>
        ))}
        {!closed && !voted ? (
          <div className="section">
            <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
              {pending ? "Saving" : "Vote"}
            </button>
          </div>
        ) : null}
        {closed ? <p className="section dim">Closed.</p> : null}
        {error ? (
          <p className="error section" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      <div className="actions">
        <p className="mono dim">/p/{pollId}</p>
        <CopyLink path={`/p/${pollId}`} />
      </div>
    </>
  );
}
