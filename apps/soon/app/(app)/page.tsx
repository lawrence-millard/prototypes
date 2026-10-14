import { EventBoard } from '@/components/event-board'
import { Landing } from '@/components/landing'
import { Shell } from '@/components/shell'
import { UserMenu } from '@/components/user-menu'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { previewEvents } from '@/lib/fixtures'
import { listEvents } from '@/lib/flow'
import { allowPreview } from '@/lib/preview'
import type { EventItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  const preview = !userId && await allowPreview()
  let events: EventItem[] = []
  let loadError = ''
  if (userId) {
    try {
      events = await readCache(['soon-events', userId], `soon:${userId}`, () => listEvents(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  } else if (preview) {
    events = previewEvents
  }

  const signedIn = Boolean(userId) || preview

  return (
    <Shell mark="s" name="soon" menu={signedIn ? <UserMenu preview={preview} /> : undefined}>
      {signedIn ? <EventBoard events={events} loadError={loadError} /> : <Landing />}
    </Shell>
  )
}
