import { Account } from '@/components/account'
import { Board } from '@/components/board'
import { Shell } from '@/components/shell'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { listSessions } from '@/lib/flow'
import type { Session } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  let sessions: Session[] = []
  let loadError = ''
  if (userId) {
    try {
      sessions = await readCache(['focus-sessions', userId], `focus:${userId}`, () => listSessions(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  }

  return (
    <Shell mark="f" name="focus">
      <Board signedIn={Boolean(userId)} sessions={sessions} loadError={loadError} />
      <Account signedIn={Boolean(userId)} />
    </Shell>
  )
}
