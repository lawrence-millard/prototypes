"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-8">
      <p className="text-[22px] font-bold text-brand">Markwise</p>
      <h1 className="mt-6 text-[32px] font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-[16px] leading-6 text-mute">Your answers are still saved. Try that screen again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 h-[52px] rounded-full bg-brand text-[16px] font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
