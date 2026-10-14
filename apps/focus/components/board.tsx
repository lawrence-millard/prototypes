'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { removeSession, renameSession, saveSession } from '@/app/(app)/actions'
import { relativeTime } from '@/lib/relative'
import { ConfirmButton } from './confirm-button'
import type { Session } from '@/lib/types'

const modes = [
  { kind: 'focus', label: 'Focus', seconds: 25 * 60 },
  { kind: 'short', label: 'Short', seconds: 5 * 60 },
  { kind: 'long', label: 'Long', seconds: 15 * 60 },
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
const ring = 2 * Math.PI * 54

function clock(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function duration(seconds: number) {
  return clock(seconds)
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

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, a, button')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === ' ') {
        event.preventDefault()
        if (running) pause()
        else start()
      } else if (event.key === 'r') {
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const full = mode.seconds
  const primaryLabel = running ? 'Pause' : remaining > 0 && remaining < full ? 'Resume' : 'Start'
  const progress = full > 0 ? 1 - remaining / full : 0

  return (
    <div className="stack">
      {!signedIn ? <p className="lede">Twenty-five minutes, then a record of the work.</p> : null}
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
      <div className="dial">
        <svg className="dial-svg" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="track" cx="60" cy="60" r="54" />
          <circle className="prog" cx="60" cy="60" r="54" strokeDasharray={ring} strokeDashoffset={ring * progress} />
        </svg>
        <p className="time mono" role="timer" aria-label={`${minutes} minutes ${seconds} seconds`}>{clock(remaining)}</p>
      </div>
      <div className="actions">
        <button type="button" className="primary" onClick={running ? pause : start} disabled={savePending && remaining === 0}>
          {primaryLabel}
        </button>
        {running || remaining !== full ? (
          <button type="button" className="ghost" onClick={reset}>Reset</button>
        ) : null}
        <span className="hint"><kbd>space</kbd> {running ? 'pause' : 'start'} <kbd>r</kbd> reset</span>
      </div>
      <div className="field">
        <label className="label" htmlFor="label">Label</label>
        <input id="label" name="label" maxLength={80} autoComplete="off" placeholder="What you are doing" value={label} onChange={(event) => setLabel(event.target.value)} />
      </div>
      {error ? <p className="err" role="alert">{error}</p> : null}
      {savePending && !signedIn ? (
        <p className="dim"><a href="/sign-in">Sign in</a> to keep this session.</p>
      ) : null}
      {signedIn ? (
        <>
          <h2 className="label">History</h2>
          {rows.length === 0 ? (
            <div className="empty"><p>No sessions</p></div>
          ) : (
            <div className="list">
              {rows.map((row) => (
                <div className="row" key={row.id}>
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
                        <input aria-label="Label" maxLength={80} placeholder="Label" value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} />
                        <button type="submit" className="text" disabled={pending}>Save</button>
                        <button type="button" className="text" onClick={() => setEditing(null)}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <p className="row-title">{row.label || row.kind}</p>
                        <p className="dim"><span className="mono">{duration(row.seconds)}</span> · {relativeTime(row.completedAt)}</p>
                      </>
                    )}
                  </div>
                  {editing === row.id ? null : (
                    <div className="ops">
                      <button
                        type="button"
                        className="icon"
                        aria-label="Edit"
                        disabled={pending}
                        onClick={() => {
                          setEditing(row.id)
                          setDraft(row.label)
                        }}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <ConfirmButton
                        label="Delete"
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
        </>
      ) : null}
    </div>
  )
}
