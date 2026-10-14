import { notFound, redirect } from 'next/navigation'
import { DeckBoard } from '@/components/deck-board'
import { Shell } from '@/components/shell'
import { UserMenu } from '@/components/user-menu'
import { currentUserId } from '@/lib/auth'
import { readCache } from '@/lib/cache'
import { getDb } from '@/lib/db'
import { previewDeck, previewDeckId } from '@/lib/fixtures'
import { getDeck } from '@/lib/flow'
import { allowPreview } from '@/lib/preview'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  const preview = !userId && await allowPreview()
  if (!userId && !preview) redirect('/sign-in')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()
  if (preview) {
    if (id !== previewDeckId) notFound()
    return (
      <Shell mark="c" name="cards" menu={<UserMenu preview />}>
        <DeckBoard deck={previewDeck} />
      </Shell>
    )
  }
  if (!userId) redirect('/sign-in')
  let deck = null
  try {
    deck = await readCache(['cards-deck', userId, id], `cards:${userId}`, () => getDeck(getDb(), userId, id))
  } catch {
    return (
      <Shell mark="c" name="cards" menu={<UserMenu />}>
        <p className="err" role="alert">could not load.</p>
      </Shell>
    )
  }
  if (!deck) notFound()
  return (
    <Shell mark="c" name="cards" menu={<UserMenu />}>
      <DeckBoard deck={deck} />
    </Shell>
  )
}
