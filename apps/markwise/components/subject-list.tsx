"use client";

import { useState } from "react";
import { updateBoard } from "@/lib/actions";
import type { BoardOption } from "@/lib/subjects";
import type { SubjectId } from "@/lib/types";

export type SubjectCard = {
  subject: SubjectId;
  label: string;
  line: string;
  available: boolean;
  specCode: string;
  options: BoardOption[];
};

export function SubjectList({ items }: { items: SubjectCard[] }) {
  const [editing, setEditing] = useState<SubjectId | null>(null);

  return (
    <div className="mt-6 flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.subject}>
          <button
            type="button"
            onClick={() => setEditing((current) => (current === item.subject ? null : item.subject))}
            className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-line bg-brand-soft px-4 py-4 text-left"
          >
            <span>
              <span className="block text-[17px] font-medium text-ink">{item.label}</span>
              <span className="mt-0.5 block text-[14px] text-mute">{item.line}</span>
              {!item.available ? (
                <span className="mt-1 block text-[13px] text-mid">No questions</span>
              ) : null}
            </span>
            <span className="shrink-0 text-[14px] text-mute">On</span>
          </button>
          {editing === item.subject ? (
            <div className="mt-2 rounded-[8px] border border-line bg-surface p-2">
              {item.options.map((option) => (
                <form key={option.specCode} action={updateBoard}>
                  <input type="hidden" name="subject" value={item.subject} />
                  <input type="hidden" name="specCode" value={option.specCode} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-[10px] px-3 py-3 text-left text-[14px] hover:bg-paper"
                  >
                    <span className="font-medium text-ink">
                      {option.board} {option.level} · {option.specCode}
                    </span>
                    <span className="text-[12px] text-mute">
                      {option.specCode === item.specCode ? "Selected" : option.available ? "Ready" : "Unavailable"}
                    </span>
                  </button>
                </form>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
