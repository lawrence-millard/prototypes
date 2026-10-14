"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="col">
          <h1>Could not load.</h1>
          <button type="button" onClick={() => reset()}>
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
