import Link from 'next/link'
import { CreateWebhookForm } from '@/components/create-webhook-form'
import { listWebhooks } from '@/lib/webhooks'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const webhooks = await listWebhooks()
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Webhooks</h1>
        </div>
      </header>
      <section className="index-card">
        <CreateWebhookForm />
      </section>
      {webhooks.length === 0 ? (
        <p className="empty">No webhooks yet.</p>
      ) : (
        <ul className="index-list">
          {webhooks.map((webhook) => (
            <li key={webhook.id}>
              <Link href={`/hooks/${webhook.id}`} prefetch={false}>
                <span>
                  {webhook.name}
                  <small className="slug">{webhook.slug}</small>
                </span>
                <span className="count">{webhook.messageCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
