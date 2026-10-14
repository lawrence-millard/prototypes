"use client";

import { useState } from "react";

export function PracticeForm({
  questionId,
  breadcrumb,
  stem,
  marks,
  commandWord,
  defaultAnswer,
  error,
  notice,
}: {
  questionId: string;
  breadcrumb: string;
  stem: string;
  marks: number;
  commandWord: string | null;
  defaultAnswer: string;
  error?: string;
  notice?: string;
}) {
  const [answer, setAnswer] = useState(defaultAnswer);
  const [pending, setPending] = useState<"mark" | "draft" | null>(null);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const target = Math.max(40, marks * 12);
  const fill = Math.min(100, Math.round((words / target) * 100));

  return (
    <form
      action="/api/mark"
      method="post"
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        setPending(submitter?.value === "draft" ? "draft" : "mark");
      }}
    >
      <input type="hidden" name="questionId" value={questionId} />
      <p className="text-[14px] text-mute">{breadcrumb}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-[8px] bg-line" aria-hidden>
        <div className="h-full rounded-[8px] bg-brand" style={{ width: `${fill}%` }} />
      </div>
      <article className="mt-4 rounded-[10px] border border-line bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-[8px] bg-brand-soft px-3 py-1 text-[13px] font-medium text-brand">{marks} marks</span>
          {commandWord ? (
            <span className="rounded-[8px] bg-surface px-3 py-1 text-[13px] font-medium text-ink">{commandWord}</span>
          ) : null}
        </div>
        {stem.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="mt-4 text-[16px] leading-7 text-ink">
            {paragraph}
          </p>
        ))}
      </article>
      <label className="mt-4 block flex-1 rounded-[10px] border border-line bg-surface p-4">
        <span className="text-[14px] text-mute">Your answer</span>
        <textarea
          name="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          required
          maxLength={8000}
          className="mt-2 min-h-[148px] w-full resize-none bg-transparent text-[16px] leading-7 text-ink outline-none"
          placeholder="Answer"
        />
      </label>
      {notice ? <p className="mt-3 text-[14px] text-mute">{notice}</p> : null}
      {error ? <p className="mt-3 text-[14px] text-bad">{error}</p> : null}
      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          name="intent"
          value="draft"
          formAction="/api/drafts"
          disabled={pending !== null}
          className="flex h-[52px] flex-1 items-center justify-center rounded-[8px] border border-line bg-surface text-[16px] font-medium text-ink disabled:opacity-60"
        >
          {pending === "draft" ? "Saving…" : "Save draft"}
        </button>
        <button
          type="submit"
          name="intent"
          value="mark"
          disabled={pending !== null}
          className="flex h-[52px] flex-[1.25] items-center justify-center rounded-[8px] bg-brand text-[16px] font-medium text-on-brand disabled:opacity-60"
        >
          {pending === "mark" ? "Marking…" : "Mark my answer"}
        </button>
      </div>
    </form>
  );
}
