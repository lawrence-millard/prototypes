'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Pencil } from 'lucide-react'
import { addEvent, editEvent, removeEvent } from '@/app/(app)/actions'
import { remainingLabel } from '@/lib/remain'
import { relativeTime } from '@/lib/relative'
import { ConfirmButton } from './confirm-button'
import type { EventItem } from '@/lib/types'

function toLocal(iso: string) {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function EventBoard({ events, loadError }: { events: EventItem[]; loadError: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rows, setRows] = useState(events)
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState(loadError)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: '', when: '', note: '' })
  const [copied, setCopied] = useState<string | null>(null)
  const [manual, setManual] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => { setRows(events) }, [events])
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  async function copy(slug: string) {
    const url = `${location.origin}/e/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(slug)
      setManual(null)
      window.setTimeout(() => setCopied((current) => current === slug ? null : current), 2000)
    } catch {
      setManual(url)
    }
  }

  return (
    <div className="stack">
      <form
        className="composer composer-block"
        onSubmit={(event) => {
          event.preventDefault()
          if (!title.trim() || !when) return
          const happensAt = new Date(when).toISOString()
          const previous = rows
          const optimistic: EventItem = { id: `temp-${crypto.randomUUID()}`, slug: '', title: title.trim().replace(/\s+/g, ' '), note: note.trim(), happensAt }
          setRows([...rows, optimistic].sort((a, b) => a.happensAt.localeCompare(b.happensAt)))
          setTitle('')
          setWhen('')
          setNote('')
          setError('')
          startTransition(async () => {
            const result = await addEvent({ title: optimistic.title, note: optimistic.note, happensAt })
            if (!result.ok) {
              setRows(previous)
              setTitle(optimistic.title)
              setWhen(when)
              setNote(optimistic.note)
              setError(result.error)
              return
            }
            router.refresh()
          })
        }}
      >
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" maxLength={120} autoComplete="off" placeholder="Launch" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label className="label" htmlFor="when">When</label>
        <input id="when" name="when" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        <label className="label" htmlFor="note">Note</label>
        <input id="note" name="note" maxLength={500} placeholder="Optional" value={note} onChange={(event) => setNote(event.target.value)} />
        <div className="composer-bar">
          <span className="dim">New event</span>
          <button type="submit" className="primary" disabled={pending || title.trim().length === 0 || when.length === 0}>Add</button>
        </div>
      </form>
      {error ? <p className="err" role="alert">{error}</p> : null}
      {manual ? <p className="mono dim">{manual}</p> : null}
      {rows.length === 0 ? <div className="empty"><p>No events</p></div> : (
        <div className="list">
          {rows.map((item) => (
            <div className="row" key={item.id}>
              <div className="grow">
                {editing === item.id ? (
                  <form
                    className="stack"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (!draft.title.trim() || !draft.when) return
                      const happensAt = new Date(draft.when).toISOString()
                      const previous = rows
                      const next = { ...item, title: draft.title.trim().replace(/\s+/g, ' '), note: draft.note.trim(), happensAt }
                      setRows(rows.map((row) => row.id === item.id ? next : row).sort((a, b) => a.happensAt.localeCompare(b.happensAt)))
                      setEditing(null)
                      startTransition(async () => {
                        const result = await editEvent({ id: item.id, title: next.title, note: next.note, happensAt })
                        if (!result.ok) {
                          setRows(previous)
                          setError(result.error)
                          return
                        }
                        router.refresh()
                      })
                    }}
                  >
                    <label className="label" htmlFor={`title-${item.id}`}>Title</label>
                    <input id={`title-${item.id}`} maxLength={120} placeholder="Launch" value={draft.title} autoFocus onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                    <label className="label" htmlFor={`when-${item.id}`}>When</label>
                    <input id={`when-${item.id}`} type="datetime-local" value={draft.when} onChange={(event) => setDraft({ ...draft, when: event.target.value })} />
                    <label className="label" htmlFor={`note-${item.id}`}>Note</label>
                    <input id={`note-${item.id}`} maxLength={500} placeholder="Optional" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
                    <div className="actions">
                      <button type="submit" className="primary" disabled={pending}>Save</button>
                      <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="row-title">{item.title}</p>
                    <p className="mono">{remainingLabel(item.happensAt, now)}</p>
                    <p className="dim">{relativeTime(item.happensAt, now)}{item.note ? ` · ${item.note}` : ''}</p>
                  </>
                )}
              </div>
              {editing === item.id || item.id.startsWith('temp-') ? null : (
                <div className="ops">
                  <button type="button" className="icon" aria-label={copied === item.slug ? 'Copied' : 'Copy'} onClick={() => void copy(item.slug)}>
                    {copied === item.slug ? <Check size={16} strokeWidth={1.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}
                  </button>
                  <button type="button" className="icon" aria-label="Edit" disabled={pending} onClick={() => { setEditing(item.id); setDraft({ title: item.title, when: toLocal(item.happensAt), note: item.note }) }}>
                    <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <ConfirmButton
                    label="Delete"
                    disabled={pending}
                    onConfirm={() => {
                      const previous = rows
                      setRows(rows.filter((row) => row.id !== item.id))
                      startTransition(async () => {
                        const result = await removeEvent({ id: item.id })
                        if (!result.ok) {
                          setRows(previous)
                          setError(result.error)
                          return
                        }
                        router.refresh()
                      })
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
