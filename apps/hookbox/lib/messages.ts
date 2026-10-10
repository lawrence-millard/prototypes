import 'server-only'
import { MESSAGE_PAGE_SIZE, UUID_RE } from './constants'
import { db } from './db'
import { asIso } from './time'
import type { Attachment, ParsedInbound, StoredMessage } from './types'

export async function insertMessage(
  webhookId: string,
  senderIp: string,
  contentType: string,
  headers: Record<string, string>,
  parsed: ParsedInbound,
): Promise<void> {
  const sql = await db()
  await sql`
    INSERT INTO messages (
      webhook_id, sender_ip, content_type, headers, raw_body, raw_encoding,
      content, username, avatar_url, embeds, payload, attachments
    ) VALUES (
      ${webhookId}::uuid,
      ${senderIp},
      ${contentType.slice(0, 200)},
      ${JSON.stringify(headers)}::jsonb,
      ${parsed.rawBody},
      ${parsed.rawEncoding},
      ${parsed.content},
      ${parsed.username},
      ${parsed.avatarUrl},
      ${parsed.embeds ? JSON.stringify(parsed.embeds) : null}::jsonb,
      ${parsed.payload === null ? null : JSON.stringify(parsed.payload)}::jsonb,
      ${JSON.stringify(parsed.attachments)}::jsonb
    )
  `
}

export async function listMessages(webhookId: string): Promise<StoredMessage[]> {
  if (!UUID_RE.test(webhookId)) return []
  const sql = await db()
  const rows = await sql`
    SELECT id, received_at, sender_ip, content_type, headers, raw_body, raw_encoding,
           content, username, avatar_url, embeds, payload, attachments
    FROM messages
    WHERE webhook_id = ${webhookId}::uuid
    ORDER BY received_at DESC, id DESC
    LIMIT ${MESSAGE_PAGE_SIZE}
  `
  return rows.map(mapMessage)
}

export async function deleteMessage(webhookId: string, messageId: string): Promise<void> {
  if (!UUID_RE.test(webhookId) || !UUID_RE.test(messageId)) return
  const sql = await db()
  await sql`
    DELETE FROM messages
    WHERE id = ${messageId}::uuid AND webhook_id = ${webhookId}::uuid
  `
}

function mapMessage(row: Record<string, unknown>): StoredMessage {
  return {
    id: String(row.id),
    receivedAt: asIso(row.received_at),
    senderIp: typeof row.sender_ip === 'string' ? row.sender_ip : null,
    contentType: typeof row.content_type === 'string' ? row.content_type : null,
    headers: asStringRecord(row.headers),
    rawBody: typeof row.raw_body === 'string' ? row.raw_body : null,
    rawEncoding: typeof row.raw_encoding === 'string' ? row.raw_encoding : 'utf8',
    content: typeof row.content === 'string' ? row.content : null,
    username: typeof row.username === 'string' ? row.username : null,
    avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : null,
    embeds: parseJson(row.embeds),
    payload: parseJson(row.payload),
    attachments: asAttachments(parseJson(row.attachments)),
  }
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value ?? null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function asStringRecord(value: unknown): Record<string, string> {
  const parsed = parseJson(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
  const record: Record<string, string> = {}
  for (const [key, item] of Object.entries(parsed)) {
    if (typeof item === 'string') record[key] = item
  }
  return record
}

function asAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    return [
      {
        name: typeof record.name === 'string' ? record.name : 'attachment',
        type: typeof record.type === 'string' ? record.type : '',
        size: typeof record.size === 'number' ? record.size : 0,
      },
    ]
  })
}
