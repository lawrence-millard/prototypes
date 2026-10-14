import { Account } from '@/components/account'
import { DeckList } from '@/components/deck-list'
import { Shell } from '@/components/shell'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { listDecks } from '@/lib/flow'
import type { Deck } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const userId = await currentUserId()
  let decks: Deck[] = []
  let loadError = ''
  if (userId) {
    try {
      decks = await readCache(['cards-decks', userId], `cards:${userId}`, () => listDecks(getDb(), userId))
    } catch {
      loadError = 'could not load.'
    }
  }

  return (
    <Shell mark="c" name="cards">
      <DeckList decks={decks} loadError={loadError} />
      <Account signedIn={Boolean(userId)} />
    </Shell>
  )
}
