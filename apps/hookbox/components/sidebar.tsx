import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { ClerkSignOut } from '@/components/clerk-sign-out'
import type { WebhookSummary } from '@/lib/types'

export function Sidebar({
  webhooks,
  activeId,
  usingClerk,
}: {
  webhooks: WebhookSummary[]
  activeId: string | null
  usingClerk: boolean
}) {
  return (
    <aside className="sidebar">
      <Link href="/" prefetch={false} className="mark">
        <strong>Hookbox</strong>
      </Link>
      <p className="eyebrow">Private inbox</p>
      <Link href="/#create" prefetch={false} className="primary new-hook">
        New webhook
      </Link>
      <p className="side-label">Webhooks</p>
      {webhooks.length === 0 ? <p className="empty">None yet.</p> : null}
      <ul className="hook-list">
        {webhooks.map((webhook) => (
          <li key={webhook.id}>
            <Link
              href={`/hooks/${webhook.id}`}
              prefetch={false}
              className={webhook.id === activeId ? 'active' : undefined}
            >
              <span>
                {webhook.name}
                <small>{webhook.slug}</small>
              </span>
              <span className="count">{webhook.messageCount}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="sign-out">
        {usingClerk ? (
          <ClerkSignOut />
        ) : (
          <form action={logout}>
            <button className="text-button" type="submit">
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  )
}
