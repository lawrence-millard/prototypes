import { Account } from '@/components/account'
import { EventBoard } from '@/components/event-board'
import { Shell } from '@/components/shell'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { listEvents } from '@/lib/flow'
import type { EventItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  let events: EventItem[] = []
  let loadError = ''
  if (userId) {
    try {
      events = await readCache(['soon-events', userId], `soon:${userId}`, () => listEvents(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  }

  return (
    <Shell mark="s" name="soon">
      <EventBoard events={events} loadError={loadError} />
      <Account signedIn={Boolean(userId)} />
    </Shell>
  )
}
