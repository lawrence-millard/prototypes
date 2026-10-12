const IP_RE = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]{2,64}$/i

const HEADER_ALLOWLIST = [
  'accept',
  'accept-encoding',
  'accept-language',
  'content-length',
  'content-type',
  'origin',
  'referer',
  'user-agent',
] as const

export function requestIsHttps(request: { headers: Headers; nextUrl: { protocol: string } }): boolean {
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (forwarded) return forwarded === 'https'
  return request.nextUrl.protocol === 'https:'
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const candidate = forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim() || ''
  if (!candidate || candidate.length > 64 || !IP_RE.test(candidate)) return 'unknown'
  return candidate
}

export function headerSubset(headers: Headers): Record<string, string> {
  const subset: Record<string, string> = {}
  for (const name of HEADER_ALLOWLIST) {
    const value = headers.get(name)
    if (!value) continue
    subset[name] = value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 512)
  }
  return subset
}

export async function readLimitedBody(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const declared = request.headers.get('content-length')
  if (declared !== null) {
    if (!/^\d+$/.test(declared)) return null
    if (Number(declared) > maxBytes) return null
  }
  if (!request.body) return new Uint8Array()

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } catch {
    return null
  }

  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}
