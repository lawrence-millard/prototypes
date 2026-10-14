import { Account } from '@/components/account'
import { Composer } from '@/components/composer'
import { Shell } from '@/components/shell'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { listSecrets } from '@/lib/flow'
import type { SecretItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  let secrets: SecretItem[] = []
  let loadError = ''
  if (userId) {
    try {
      secrets = await readCache(['secret-links', userId], `secret:${userId}`, () => listSecrets(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  }

  return (
    <Shell mark="#" name="secret">
      <Composer secrets={secrets} loadError={loadError} />
      <Account signedIn={Boolean(userId)} />
    </Shell>
  )
}
