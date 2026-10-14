"use client";

export function Ago({ at }: { at?: string }) {
  if (!at) return null;
  const then = new Date(at).getTime();
  if (Number.isNaN(then)) return null;
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  let label = "just now";
  if (minutes >= 1 && minutes < 60) label = `${minutes}m ago`;
  else if (minutes >= 60 && minutes < 60 * 24) label = `${Math.round(minutes / 60)}h ago`;
  else if (minutes >= 60 * 24 && minutes < 60 * 24 * 14) label = `${Math.round(minutes / 1440)}d ago`;
  else if (minutes >= 60 * 24 * 14) {
    label = new Date(at).toLocaleDateString("en", { month: "short", day: "numeric" });
  }
  return (
    <time className="ago" dateTime={at} suppressHydrationWarning>
      {label}
    </time>
  );
}
