import { DeckList } from '@/components/deck-list'
import { Landing } from '@/components/landing'
import { Shell } from '@/components/shell'
import { UserMenu } from '@/components/user-menu'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { previewDecks } from '@/lib/fixtures'
import { listDecks } from '@/lib/flow'
import { allowPreview } from '@/lib/preview'
import type { Deck } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  const preview = !userId && await allowPreview()
  let decks: Deck[] = []
  let loadError = ''
  if (userId) {
    try {
      decks = await readCache(['cards-decks', userId], `cards:${userId}`, () => listDecks(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  } else if (preview) {
    decks = previewDecks
  }

  const signedIn = Boolean(userId) || preview

  return (
    <Shell mark="c" name="cards" menu={signedIn ? <UserMenu preview={preview} /> : undefined}>
      {signedIn ? <DeckList decks={decks} loadError={loadError} /> : <Landing />}
    </Shell>
  )
}
