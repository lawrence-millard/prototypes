import { notFound } from 'next/navigation'
import { deleteWebhookAction } from '@/app/(dash)/actions'
import { AutoRefresh } from '@/components/auto-refresh'
import { MessageCard } from '@/components/message-card'
import { WebhookControls } from '@/components/webhook-controls'
import { MESSAGE_PAGE_SIZE } from '@/lib/constants'
import { listMessages } from '@/lib/messages'
import { formatTime } from '@/lib/time'
import { getWebhook } from '@/lib/webhooks'

export const dynamic = 'force-dynamic'

export default async function WebhookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const webhook = await getWebhook(id)
  if (!webhook) notFound()
  const messages = await listMessages(webhook.id)

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Webhook</p>
          <h1>{webhook.name}</h1>
          <p className="slug">
            {webhook.slug} · created {formatTime(webhook.createdAt)} · {webhook.messageCount} messages
          </p>
        </div>
        <AutoRefresh />
      </header>
      <WebhookControls id={webhook.id} name={webhook.name} />
      <details className="confirm">
        <summary>Delete webhook</summary>
        <form action={deleteWebhookAction}>
          <input type="hidden" name="id" value={webhook.id} />
          <p className="lede">This deletes the webhook and every message it has received.</p>
          <button className="danger" type="submit">
            Delete permanently
          </button>
        </form>
      </details>
      {messages.length === 0 ? (
        <p className="empty">No messages yet. Send a POST to the URL you copied when this webhook was created.</p>
      ) : (
        <section>
          <p className="slug">Newest {Math.min(messages.length, MESSAGE_PAGE_SIZE)}</p>
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} webhookId={webhook.id} />
          ))}
        </section>
      )}
    </>
  )
}
