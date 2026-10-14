import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Countdown } from '@/components/countdown'
import { Shell } from '@/components/shell'
import { getDb } from '@/lib/db'
import { readPublic } from '@/lib/flow'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const event = await readPublic(getDb(), slug)
    if (!event) return { title: 'soon' }
    return { title: event.title }
  } catch {
    return { title: 'soon' }
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let event = null
  try {
    event = await readPublic(getDb(), slug)
  } catch {
    return (
      <Shell mark="s" name="soon">
        <p className="err" role="alert">could not load.</p>
      </Shell>
    )
  }
  if (!event) notFound()
  const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(event.happensAt))
  return (
    <Shell mark="s" name="soon">
      <h2 className="title">{event.title}</h2>
      <Countdown iso={event.happensAt} />
      <p className="dim mono">{when}</p>
      {event.note ? <p style={{ marginTop: 12 }}>{event.note}</p> : null}
    </Shell>
  )
}
