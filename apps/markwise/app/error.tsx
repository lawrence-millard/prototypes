"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[500px] flex-col px-4 pt-16">
      <p className="label">Markwise</p>
      <h1 className="mt-3 text-[26px] tracking-tight">Something went wrong</h1>
      <button
        type="button"
        onClick={reset}
        className="mt-8 h-11 rounded-[8px] bg-brand px-4 text-[16px] text-on-brand"
      >
        Try again
      </button>
    </main>
  );
}
