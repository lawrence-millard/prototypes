import type { Attachment, ParsedInbound } from './types'

export async function parseInbound(contentType: string, body: Uint8Array): Promise<ParsedInbound> {
  const utf8 = decodeUtf8(body)
  const rawEncoding = utf8 === null ? 'base64' : 'utf8'
  const rawBody = utf8 ?? Buffer.from(body).toString('base64')
  const mediaType = contentType.split(';')[0]?.trim().toLowerCase() ?? ''

  if (mediaType === 'multipart/form-data') {
    return parseMultipart(contentType, body, rawBody, rawEncoding)
  }

  const text = utf8 ?? ''
  if (mediaType === 'application/json' || mediaType.endsWith('+json') || looksLikeJson(text)) {
    try {
      return {
        ...extractPayload(JSON.parse(text) as unknown),
        attachments: [],
        rawBody,
        rawEncoding,
      }
    } catch {
      return blank(text, rawBody, rawEncoding)
    }
  }

  return blank(text, rawBody, rawEncoding)
}

async function parseMultipart(
  contentType: string,
  body: Uint8Array,
  rawBody: string,
  rawEncoding: 'utf8' | 'base64',
): Promise<ParsedInbound> {
  try {
    const form = await new Request('http://127.0.0.1/hook', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: Buffer.from(body),
    }).formData()

    const attachments: Attachment[] = []
    let payload: unknown | null = null
    let payloadText: string | null = null

    for (const [key, value] of form.entries()) {
      if (value instanceof File) {
        attachments.push({
          name: sanitizeFileName(value.name),
          type: value.type.slice(0, 128),
          size: value.size,
        })
        continue
      }
      if (key === 'payload_json') {
        payloadText = value
        try {
          payload = JSON.parse(value) as unknown
        } catch {
          payload = null
        }
      }
    }

    if (payload === null) return { ...blank(payloadText, rawBody, rawEncoding), attachments }
    return { ...extractPayload(payload), attachments, rawBody, rawEncoding }
  } catch {
    return blank(null, rawBody, rawEncoding)
  }
}

function extractPayload(payload: unknown): Omit<ParsedInbound, 'attachments' | 'rawBody' | 'rawEncoding'> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { content: null, username: null, avatarUrl: null, embeds: null, payload }
  }
  const record = payload as Record<string, unknown>
  return {
    content: asText(record.content, 100_000),
    username: asText(record.username, 80),
    avatarUrl: asText(record.avatar_url, 2_000),
    embeds: Array.isArray(record.embeds) ? record.embeds : null,
    payload,
  }
}

function blank(
  content: string | null,
  rawBody: string,
  rawEncoding: 'utf8' | 'base64',
): ParsedInbound {
  const text = content?.trim() ? content : null
  return {
    content: text,
    username: null,
    avatarUrl: null,
    embeds: null,
    payload: null,
    attachments: [],
    rawBody,
    rawEncoding,
  }
}

function asText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function looksLikeJson(text: string): boolean {
  const start = text.trimStart()[0]
  return start === '{' || start === '['
}

function decodeUtf8(body: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(body)
  } catch {
    return null
  }
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\]/g, '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200)
  return base || 'attachment'
}
