"use client"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="frame">
      <p className="alert" role="alert">unavailable</p>
      <button type="button" className="primary" onClick={() => reset()}>retry</button>
    </main>
  )
}
