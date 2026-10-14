"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <ThemeToggle />
      <main className="col">
        <h1>Could not load.</h1>
        <button className="ghost" type="button" onClick={() => reset()}>
          Retry
        </button>
      </main>
    </>
  );
}
