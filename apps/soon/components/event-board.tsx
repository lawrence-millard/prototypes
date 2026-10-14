'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addEvent, editEvent, removeEvent } from '@/app/(app)/actions'
import { ConfirmButton } from './confirm-button'
import { remainingLabel } from '@/lib/remain'
import type { EventItem } from '@/lib/types'

function toLocal(iso: string) {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function whenLabel(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
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
        className="stack"
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
        <div className="field">
          <label className="label" htmlFor="title">title</label>
          <input id="title" name="title" maxLength={120} autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="when">when</label>
          <input id="when" name="when" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="note">note</label>
          <textarea id="note" name="note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <button type="submit" className="primary" disabled={pending || title.trim().length === 0 || when.length === 0}>add</button>
      </form>
      {error ? <p className="err" role="alert">{error}</p> : null}
      {manual ? <p className="mono dim">{manual}</p> : null}
      {rows.length === 0 ? <p className="dim">no events</p> : (
        <div>
          {rows.map((item) => (
            <div className="item" key={item.id}>
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
                    <label className="label" htmlFor={`title-${item.id}`}>title</label>
                    <input id={`title-${item.id}`} maxLength={120} value={draft.title} autoFocus onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                    <label className="label" htmlFor={`when-${item.id}`}>when</label>
                    <input id={`when-${item.id}`} type="datetime-local" value={draft.when} onChange={(event) => setDraft({ ...draft, when: event.target.value })} />
                    <label className="label" htmlFor={`note-${item.id}`}>note</label>
                    <textarea id={`note-${item.id}`} maxLength={500} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
                    <div className="actions">
                      <button type="submit" className="primary" disabled={pending}>save</button>
                      <button type="button" className="ghost" onClick={() => setEditing(null)}>cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="title" style={{ fontSize: 16 }}>{item.title}</p>
                    <p className="mono">{remainingLabel(item.happensAt, now)}</p>
                    <p className="dim mono">{whenLabel(item.happensAt)}</p>
                    {item.note ? <p className="dim">{item.note}</p> : null}
                  </>
                )}
              </div>
              {editing === item.id || item.id.startsWith('temp-') ? null : (
                <div className="ops">
                  <button type="button" className="text" onClick={() => void copy(item.slug)}>{copied === item.slug ? 'copied' : 'copy'}</button>
                  <button type="button" className="text" disabled={pending} onClick={() => { setEditing(item.id); setDraft({ title: item.title, when: toLocal(item.happensAt), note: item.note }) }}>edit</button>
                  <ConfirmButton
                    label="delete"
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
