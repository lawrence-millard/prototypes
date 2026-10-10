import { MAX_BODY_BYTES } from '@/lib/constants'
import { sanitizeError } from '@/lib/errors'
import { clientIp, headerSubset, readLimitedBody } from '@/lib/http'
import { insertMessage } from '@/lib/messages'
import { parseInbound } from '@/lib/parse'
import { allowIngest } from '@/lib/rate-limit'
import { authorizeWebhook } from '@/lib/webhooks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'cache-control': 'no-store' }

async function ingest(
  request: Request,
  context: { params: Promise<{ id: string; token: string }> },
): Promise<Response> {
  const { id, token } = await context.params
  let webhookId: string | null
  try {
    const ip = clientIp(request.headers)
    const allowed = await allowIngest(ip)
    if (!allowed) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { ...noStore, 'retry-after': '60' },
      })
    }
    webhookId = await authorizeWebhook(id, token)
    if (!webhookId) return new Response(null, { status: 404, headers: noStore })
    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { ...noStore, allow: 'POST' } })
    }
    const body = await readLimitedBody(request, MAX_BODY_BYTES)
    if (!body) return new Response('Payload Too Large', { status: 413, headers: noStore })
    const contentType = request.headers.get('content-type') ?? ''
    const parsed = await parseInbound(contentType, body)
    await insertMessage(webhookId, ip, contentType, headerSubset(request.headers), parsed)
  } catch (error) {
    console.error('ingest_failed', sanitizeError(error))
    return new Response(null, { status: 503, headers: noStore })
  }
  return new Response(null, { status: 204, headers: noStore })
}

export const GET = ingest
export const POST = ingest
export const PUT = ingest
export const PATCH = ingest
export const DELETE = ingest
export const HEAD = ingest
export const OPTIONS = ingest
