import { deleteMessageAction } from '@/app/(dash)/actions'
import { DiscordMessage } from '@/components/discord'
import { RAW_PREVIEW_LIMIT } from '@/lib/constants'
import { formatTime } from '@/lib/time'
import type { StoredMessage } from '@/lib/types'

export function MessageCard({
  message,
  webhookId,
}: {
  message: StoredMessage
  webhookId: string
}) {
  return (
    <article className="card">
      <header className="card-top">
        <time dateTime={message.receivedAt}>{formatTime(message.receivedAt)}</time>
        <span>{message.senderIp ?? 'unknown ip'}</span>
        <span>{message.contentType ?? 'no content type'}</span>
        <details className="confirm">
          <summary>Delete</summary>
          <form action={deleteMessageAction}>
            <input type="hidden" name="webhookId" value={webhookId} />
            <input type="hidden" name="messageId" value={message.id} />
            <button className="danger" type="submit">
              Delete message
            </button>
          </form>
        </details>
      </header>
      <DiscordMessage
        content={message.content}
        username={message.username}
        embeds={message.embeds}
        attachments={message.attachments}
      />
      <details className="raw">
        <summary>Raw payload</summary>
        <pre>{rawPreview(message)}</pre>
      </details>
    </article>
  )
}

function rawPreview(message: StoredMessage): string {
  const parsed =
    message.payload === null || message.payload === undefined
      ? null
      : JSON.stringify(message.payload, null, 2)
  const raw =
    message.rawEncoding === 'utf8'
      ? (message.rawBody ?? '')
      : `[binary body stored as base64, ${message.rawBody?.length ?? 0} characters]`
  const parts = [
    parsed ? `parsed\n${truncate(parsed)}` : null,
    `raw (${message.rawEncoding})\n${truncate(raw)}`,
    `headers\n${truncate(JSON.stringify(message.headers, null, 2))}`,
  ]
  return parts.filter(Boolean).join('\n\n')
}

function truncate(value: string): string {
  if (value.length <= RAW_PREVIEW_LIMIT) return value
  return `${value.slice(0, RAW_PREVIEW_LIMIT)}\n…truncated`
}
