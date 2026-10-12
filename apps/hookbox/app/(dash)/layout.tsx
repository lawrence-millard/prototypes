import { headers } from 'next/headers'
import { Sidebar } from '@/components/sidebar'
import { requireSession } from '@/lib/auth'
import { clerkEnabled } from '@/lib/clerk-mode'
import { UUID_RE } from '@/lib/constants'
import { sanitizeError } from '@/lib/errors'
import { listWebhooks } from '@/lib/webhooks'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession()
  const path = (await headers()).get('x-hookbox-path') ?? ''
  const segment = path.split('/')[2] ?? ''
  const activeId = UUID_RE.test(segment) ? segment : null

  let webhooks: Awaited<ReturnType<typeof listWebhooks>> = []
  let databaseError = false
  try {
    webhooks = await listWebhooks()
  } catch (error) {
    databaseError = true
    console.error('list_webhooks_failed', sanitizeError(error))
  }

  return (
    <div className="shell">
      <Sidebar webhooks={webhooks} activeId={activeId} usingClerk={clerkEnabled()} />
      <main className="main">
        {databaseError ? <p className="error">Hookbox cannot reach the database.</p> : children}
      </main>
    </div>
  )
}
