import type { ReactNode } from 'react'

export function FullScreenMessage({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <main className="fullscreen">
      <h1>{title}</h1>
      <p>{body}</p>
      {action}
    </main>
  )
}

export function storageMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.startsWith('Could not')) return err.message
  return fallback
}
