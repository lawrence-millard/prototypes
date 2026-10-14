"use client"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="frame">
      <div className="empty-state">
        <p className="alert" role="alert">Unavailable</p>
        <button type="button" className="primary" onClick={() => reset()}>Retry</button>
      </div>
    </main>
  )
}
