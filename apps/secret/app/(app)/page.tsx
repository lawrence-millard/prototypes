import { Composer } from '@/components/composer'
import { Landing } from '@/components/landing'
import { Shell } from '@/components/shell'
import { UserMenu } from '@/components/user-menu'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { previewSecrets } from '@/lib/fixtures'
import { listSecrets } from '@/lib/flow'
import { allowPreview } from '@/lib/preview'
import type { SecretItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  const preview = !userId && await allowPreview()
  let secrets: SecretItem[] = []
  let loadError = ''
  if (userId) {
    try {
      secrets = await readCache(['secret-links', userId], `secret:${userId}`, () => listSecrets(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  } else if (preview) {
    secrets = previewSecrets
  }

  const signedIn = Boolean(userId) || preview

  return (
    <Shell mark="#" name="secret" menu={signedIn ? <UserMenu preview={preview} /> : undefined}>
      {signedIn ? <Composer secrets={secrets} loadError={loadError} /> : <Landing />}
    </Shell>
  )
}
