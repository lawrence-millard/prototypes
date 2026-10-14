import 'server-only'
import { headers } from 'next/headers'

export async function allowPreview() {
  if (process.env.SCREENSHOTS !== '1') return false
  const host = (await headers()).get('host') ?? ''
  return /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)
}
