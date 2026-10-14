'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeSession, renameSession, saveSession } from '@/app/(app)/actions'
import { ConfirmButton } from './confirm-button'
import type { Session } from '@/lib/types'

const modes = [
  { kind: 'focus', label: 'focus', seconds: 25 * 60 },
  { kind: 'short', label: 'short', seconds: 5 * 60 },
  { kind: 'long', label: 'long', seconds: 15 * 60 },
] as const

type Kind = (typeof modes)[number]['kind']

type Stored = {
  id: string | null
  kind: Kind
  label: string
  running: boolean
  end: number | null
  remaining: number
  pending: boolean
}

const storageKey = 'timer'

function clock(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function duration(seconds: number) {
  return clock(seconds)
}

function shortDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function readStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    if (!modes.some((mode) => mode.kind === parsed.kind)) return null
    if (typeof parsed.remaining !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function Board({
  signedIn,
  sessions,
  loadError,
}: {
  signedIn: boolean
  sessions: Session[]
  loadError: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [kind, setKind] = useState<Kind>('focus')
  const [label, setLabel] = useState('')
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(loadError)
  const [rows, setRows] = useState(sessions)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [savePending, setSavePending] = useState(false)
  const endRef = useRef<number | null>(null)
  const idRef = useRef<string | null>(null)
  const savingRef = useRef(false)
  const buttons = useRef<Record<Kind, HTMLButtonElement | null>>({ focus: null, short: null, long: null })
  const [hydrated, setHydrated] = useState(false)
  const payloadRef = useRef<{ id: string; kind: Kind; seconds: number; label: string } | null>(null)
  const labelRef = useRef(label)
  const kindRef = useRef(kind)
  labelRef.current = label
  kindRef.current = kind

  const mode = modes.find((item) => item.kind === kind) ?? modes[0]

  function persist(next: Stored) {
    sessionStorage.setItem(storageKey, JSON.stringify(next))
  }

  useEffect(() => {
    setRows(sessions)
  }, [sessions])

  useEffect(() => {
    const stored = readStored()
    if (stored) {
      const full = modes.find((item) => item.kind === stored.kind)?.seconds ?? 25 * 60
      let nextRemaining = stored.remaining
      let nextRunning = stored.running
      let nextEnd = stored.end
      let nextPending = stored.pending
      if (stored.running && stored.end) {
        nextRemaining = Math.max(0, Math.round((stored.end - Date.now()) / 1000))
        if (nextRemaining === 0) {
          nextRunning = false
          nextEnd = null
          nextPending = true
        }
      }
      setKind(stored.kind)
      setLabel(stored.label)
      setRemaining(nextRemaining > 0 || stored.running ? nextRemaining : stored.remaining || full)
      setRunning(nextRunning)
      setSavePending(nextPending)
      endRef.current = nextRunning ? nextEnd : null
      idRef.current = stored.id
      if (nextPending && stored.id) {
        payloadRef.current = { id: stored.id, kind: stored.kind, seconds: full, label: stored.label }
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!running) return
    const tick = window.setInterval(() => {
      if (endRef.current == null) return
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        endRef.current = null
        setRunning(false)
        if (!idRef.current) idRef.current = crypto.randomUUID()
        const currentKind = kindRef.current
        const seconds = modes.find((item) => item.kind === currentKind)?.seconds ?? 25 * 60
        payloadRef.current = { id: idRef.current, kind: currentKind, seconds, label: labelRef.current }
        setSavePending(true)
      }
    }, 200)
    return () => window.clearInterval(tick)
  }, [running])

  useEffect(() => {
    if (!hydrated) return
    persist({
      id: idRef.current,
      kind,
      label,
      running,
      end: endRef.current,
      remaining,
      pending: savePending,
    })
  }, [hydrated, kind, label, running, remaining, savePending])

  useEffect(() => {
    if (!savePending || !signedIn || savingRef.current || !payloadRef.current) return
    const payload = payloadRef.current
    savingRef.current = true
    void saveSession(payload).then((result) => {
      savingRef.current = false
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSavePending(false)
      idRef.current = null
      payloadRef.current = null
      setRows((current) => {
        if (current.some((row) => row.id === payload.id)) return current
        return [{ id: payload.id, kind: payload.kind, seconds: payload.seconds, label: payload.label.trim().replace(/\s+/g, ' '), completedAt: new Date().toISOString() }, ...current]
      })
      router.refresh()
    })
  }, [savePending, signedIn, router])

  function pick(next: Kind) {
    if (running || savePending) return
    const picked = modes.find((item) => item.kind === next) ?? modes[0]
    setKind(picked.kind)
    setRemaining(picked.seconds)
    endRef.current = null
    idRef.current = null
    setError('')
    buttons.current[picked.kind]?.focus()
  }

  function start() {
    const seconds = remaining > 0 ? remaining : mode.seconds
    if (remaining === 0) setRemaining(seconds)
    endRef.current = Date.now() + seconds * 1000
    setRunning(true)
    setSavePending(false)
    setError('')
  }

  function pause() {
    if (endRef.current != null) setRemaining(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)))
    endRef.current = null
    setRunning(false)
  }

  function reset() {
    endRef.current = null
    idRef.current = null
    setRunning(false)
    setSavePending(false)
    setRemaining(mode.seconds)
    setError('')
  }

  function onModeKey(event: React.KeyboardEvent) {
    const order = modes.map((item) => item.kind)
    const index = order.indexOf(kind)
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      pick(order[(index + 1) % order.length] ?? 'focus')
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      pick(order[(index + order.length - 1) % order.length] ?? 'focus')
    }
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const full = mode.seconds
  const primaryLabel = running ? 'pause' : remaining > 0 && remaining < full ? 'resume' : 'start'

  return (
    <div>
      <div className="modes" role="radiogroup" aria-label="mode" onKeyDown={onModeKey}>
        {modes.map((item) => (
          <button
            key={item.kind}
            ref={(node) => { buttons.current[item.kind] = node }}
            type="button"
            role="radio"
            className="mode"
            aria-checked={kind === item.kind}
            tabIndex={kind === item.kind ? 0 : -1}
            disabled={running || savePending}
            onClick={() => pick(item.kind)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="time mono" role="timer" aria-label={`${minutes} minutes ${seconds} seconds`}>{clock(remaining)}</p>
      <div className="actions">
        <button type="button" className="primary" onClick={running ? pause : start} disabled={savePending && remaining === 0}>
          {primaryLabel}
        </button>
        {running || remaining !== full ? (
          <button type="button" className="ghost" onClick={reset}>reset</button>
        ) : null}
      </div>
      <form className="field" style={{ marginTop: 16 }} onSubmit={(event) => event.preventDefault()}>
        <label className="label" htmlFor="label">label</label>
        <input id="label" name="label" maxLength={80} autoComplete="off" value={label} onChange={(event) => setLabel(event.target.value)} />
      </form>
      {error ? <p className="err" role="alert" style={{ marginTop: 12 }}>{error}</p> : null}
      {savePending && !signedIn ? (
        <p className="dim" style={{ marginTop: 12 }}><a href="/sign-in">sign in</a></p>
      ) : null}
      <h2 className="label">history</h2>
      {rows.length === 0 ? <p className="dim">no sessions</p> : (
        <div>
          {rows.map((row) => (
            <div className="item" key={row.id}>
              <div className="grow">
                {editing === row.id ? (
                  <form
                    className="inline"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const previous = rows
                      const nextLabel = draft.trim().replace(/\s+/g, ' ')
                      setRows(rows.map((item) => item.id === row.id ? { ...item, label: nextLabel } : item))
                      setEditing(null)
                      startTransition(async () => {
                        const result = await renameSession({ id: row.id, label: draft })
                        if (!result.ok) {
                          setRows(previous)
                          setError(result.error)
                          return
                        }
                        router.refresh()
                      })
                    }}
                  >
                    <input aria-label="label" maxLength={80} value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} />
                    <button type="submit" className="text" disabled={pending}>save</button>
                    <button type="button" className="text" onClick={() => setEditing(null)}>cancel</button>
                  </form>
                ) : (
                  <>
                    {row.label ? <p className="title" style={{ fontSize: 16 }}>{row.label}</p> : null}
                    <p className="dim mono">{row.kind} · {duration(row.seconds)} · {shortDate(row.completedAt)}</p>
                  </>
                )}
              </div>
              {editing === row.id ? null : (
                <div className="ops">
                  <button
                    type="button"
                    className="text"
                    disabled={pending}
                    onClick={() => {
                      setEditing(row.id)
                      setDraft(row.label)
                    }}
                  >
                    edit
                  </button>
                  <ConfirmButton
                    label="delete"
                    disabled={pending}
                    onConfirm={() => {
                      const previous = rows
                      setRows(rows.filter((item) => item.id !== row.id))
                      startTransition(async () => {
                        const result = await removeSession({ id: row.id })
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
