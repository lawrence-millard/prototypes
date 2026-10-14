import { Board } from '@/components/board'
import { Shell } from '@/components/shell'
import { UserMenu } from '@/components/user-menu'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { previewSessions } from '@/lib/fixtures'
import { listSessions } from '@/lib/flow'
import { allowPreview } from '@/lib/preview'
import type { Session } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  const preview = !userId && await allowPreview()
  let sessions: Session[] = []
  let loadError = ''
  if (userId) {
    try {
      sessions = await readCache(['focus-sessions', userId], `focus:${userId}`, () => listSessions(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  } else if (preview) {
    sessions = previewSessions
  }

  const signedIn = Boolean(userId) || preview

  return (
    <Shell mark="f" name="focus" menu={signedIn ? <UserMenu preview={preview} /> : undefined}>
      <Board signedIn={signedIn} sessions={sessions} loadError={loadError} />
    </Shell>
  )
}
