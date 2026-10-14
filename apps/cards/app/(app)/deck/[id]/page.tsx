import { notFound, redirect } from 'next/navigation'
import { Account } from '@/components/account'
import { DeckBoard } from '@/components/deck-board'
import { Shell } from '@/components/shell'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { getDeck } from '@/lib/flow'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  if (!userId) redirect('/sign-in')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()
  let deck = null
  try {
    deck = await readCache(['cards-deck', userId, id], `cards:${userId}`, () => getDeck(getDb(), userId, id))
  } catch {
    return (
      <Shell mark="c" name="cards">
        <p className="err" role="alert">could not load.</p>
      </Shell>
    )
  }
  if (!deck) notFound()
  return (
    <Shell mark="c" name="cards">
      <DeckBoard deck={deck} />
      <Account signedIn />
    </Shell>
  )
}
