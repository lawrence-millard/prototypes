"use client";

import { useEffect, useRef } from "react";

export function useKey(key: string, run: () => void) {
  const ref = useRef(run);
  ref.current = run;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target instanceof HTMLElement ? event.target : null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      event.preventDefault();
      ref.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);
}
