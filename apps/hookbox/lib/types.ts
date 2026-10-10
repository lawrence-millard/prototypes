export type Attachment = {
  name: string
  type: string
  size: number
}

export type WebhookSummary = {
  id: string
  name: string
  slug: string
  createdAt: string
  messageCount: number
}

export type StoredMessage = {
  id: string
  receivedAt: string
  senderIp: string | null
  contentType: string | null
  headers: Record<string, string>
  rawBody: string | null
  rawEncoding: string
  content: string | null
  username: string | null
  avatarUrl: string | null
  embeds: unknown
  payload: unknown
  attachments: Attachment[]
}

export type ParsedInbound = {
  content: string | null
  username: string | null
  avatarUrl: string | null
  embeds: unknown[] | null
  payload: unknown | null
  attachments: Attachment[]
  rawBody: string
  rawEncoding: 'utf8' | 'base64'
}
