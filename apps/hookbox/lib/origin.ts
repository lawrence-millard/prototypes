import 'server-only'
import { headers } from 'next/headers'

export async function requestOrigin(): Promise<string> {
  const headerList = await headers()
  const host = (headerList.get('host') ?? '').trim()
  const forwarded = headerList.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const proto = forwarded === 'https' || forwarded === 'http' ? forwarded : 'http'
  if (!/^[A-Za-z0-9.-]+(?::\d+)?$/.test(host)) throw new Error('invalid host')
  return `${proto}://${host}`
}

export function webhookIngestUrl(origin: string, id: string, token: string): string {
  return `${origin}/api/hook/${encodeURIComponent(id)}/${encodeURIComponent(token)}`
}
