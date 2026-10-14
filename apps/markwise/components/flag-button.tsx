"use client";

import { useState } from "react";

export function FlagButton({ attemptId, flagged }: { attemptId: string; flagged: boolean }) {
  const [done, setDone] = useState(flagged);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (done || pending) return;
    setPending(true);
    const response = await fetch("/api/attempts/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId }),
    });
    setPending(false);
    if (response.ok) setDone(true);
  }

  return (
    <button type="button" onClick={onClick} className="mt-3 text-[13px] font-medium text-brand">
      {done ? "Flagged" : pending ? "Flagging" : "Flag mark"}
    </button>
  );
}
