'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { addCard, editCard, editDeck, gradeCard, removeCard, removeDeck } from '@/app/(app)/actions'
import { nextReview } from '@/lib/srs'
import { ConfirmButton } from './confirm-button'
import type { Card, DeckDetail, Grade } from '@/lib/types'

function gap(card: Card) {
  if (card.intervalDays <= 0) return '10m'
  return card.intervalDays === 1 ? '1d' : `${card.intervalDays}d`
}

export function DeckBoard({ deck }: { deck: DeckDetail }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(deck.name)
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(deck.name)
  const [cards, setCards] = useState(deck.cards)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [shown, setShown] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [draftFront, setDraftFront] = useState('')
  const [draftBack, setDraftBack] = useState('')
  const [error, setError] = useState('')
  const goodRef = useRef<HTMLButtonElement>(null)
  const due = [...cards].filter((card) => new Date(card.dueAt).getTime() <= Date.now()).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const current = due[0] ?? null

  useEffect(() => {
    setName(deck.name)
    setCards(deck.cards)
  }, [deck])

  useEffect(() => { setShown(false) }, [current?.id])

  useEffect(() => {
    if (shown) goodRef.current?.focus()
  }, [shown])

  function grade(value: Grade) {
    if (!current) return
    const previous = cards
    const next = nextReview(current, value, new Date())
    setCards(cards.map((card) => card.id === current.id ? { ...card, ease: next.ease, intervalDays: next.intervalDays, repetitions: next.repetitions, dueAt: next.dueAt.toISOString() } : card))
    setShown(false)
    setError('')
    startTransition(async () => {
      const result = await gradeCard({ id: current.id, grade: value })
      if (!result.ok) {
        setCards(previous)
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (!current) return
      if (event.key === ' ' && !(target instanceof HTMLElement && target.closest('button, a'))) {
        event.preventDefault()
        setShown((value) => !value)
      }
      if (!shown) return
      if (event.key === '1') grade('again')
      if (event.key === '2') grade('good')
      if (event.key === '3') grade('easy')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="stack">
      <div className="row" style={{ borderBottom: 0 }}>
        <div className="grow">
          {renaming ? (
            <form
              className="inline"
              onSubmit={(event) => {
                event.preventDefault()
                const next = draftName.trim().replace(/\s+/g, ' ')
                if (!next) return
                setName(next)
                setRenaming(false)
                startTransition(async () => {
                  const result = await editDeck({ id: deck.id, name: next })
                  if (!result.ok) {
                    setName(deck.name)
                    setError(result.error)
                    return
                  }
                  router.refresh()
                })
              }}
            >
              <input aria-label="Name" maxLength={80} placeholder="Deck name" value={draftName} autoFocus onChange={(event) => setDraftName(event.target.value)} />
              <button type="submit" className="text" disabled={pending || draftName.trim().length === 0}>Save</button>
              <button type="button" className="text" onClick={() => setRenaming(false)}>Cancel</button>
            </form>
          ) : (
            <p className="row-title">{name}</p>
          )}
        </div>
        {renaming ? null : (
          <div className="ops">
            <button type="button" className="icon" aria-label="Edit" disabled={pending} onClick={() => { setRenaming(true); setDraftName(name) }}>
              <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <ConfirmButton
              label="Delete"
              disabled={pending}
              onConfirm={() => {
                startTransition(async () => {
                  const result = await removeDeck({ id: deck.id })
                  if (!result.ok) {
                    setError(result.error)
                    return
                  }
                  router.push('/')
                  router.refresh()
                })
              }}
            />
          </div>
        )}
      </div>
      {current ? (
        <div className="stack">
          <button type="button" className="flip" aria-pressed={shown} onClick={() => setShown((value) => !value)}>
            <span className={shown ? 'flip-inner is-shown' : 'flip-inner'}>
              <span className="face">{current.front}</span>
              <span className="face back">{current.back}</span>
            </span>
          </button>
          <p className="hint"><kbd>space</kbd> flip {shown ? <><kbd>1</kbd> again <kbd>2</kbd> good <kbd>3</kbd> easy</> : null}</p>
          {shown ? (
            <div className="actions">
              <button type="button" className="ghost" disabled={pending} onClick={() => grade('again')}>Again</button>
              <button ref={goodRef} type="button" className="primary" disabled={pending} onClick={() => grade('good')}>Good</button>
              <button type="button" className="ghost" disabled={pending} onClick={() => grade('easy')}>Easy</button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty"><p>Nothing due</p></div>
      )}
      {error ? <p className="err" role="alert">{error}</p> : null}
      <h2 className="label">Cards</h2>
      {cards.length === 0 ? <div className="empty"><p>No cards</p></div> : (
        <div className="list">
          {cards.map((card) => (
            <div className="row" key={card.id}>
              <div className="grow">
                {editing === card.id ? (
                  <form
                    className="stack"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const nextFront = draftFront.trim()
                      const nextBack = draftBack.trim()
                      if (!nextFront || !nextBack) return
                      const previous = cards
                      setCards(cards.map((item) => item.id === card.id ? { ...item, front: nextFront, back: nextBack } : item))
                      setEditing(null)
                      startTransition(async () => {
                        const result = await editCard({ id: card.id, front: nextFront, back: nextBack })
                        if (!result.ok) {
                          setCards(previous)
                          setError(result.error)
                          return
                        }
                        router.refresh()
                      })
                    }}
                  >
                    <label className="label" htmlFor={`front-${card.id}`}>Front</label>
                    <textarea id={`front-${card.id}`} maxLength={2000} placeholder="Front" value={draftFront} onChange={(event) => setDraftFront(event.target.value)} />
                    <label className="label" htmlFor={`back-${card.id}`}>Back</label>
                    <textarea id={`back-${card.id}`} maxLength={2000} placeholder="Back" value={draftBack} onChange={(event) => setDraftBack(event.target.value)} />
                    <div className="actions">
                      <button type="submit" className="primary" disabled={pending}>Save</button>
                      <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="row-title">{card.front}</p>
                    <p className="dim mono">{gap(card)}</p>
                  </>
                )}
              </div>
              {editing === card.id ? null : (
                <div className="ops">
                  <button type="button" className="icon" aria-label="Edit" disabled={pending} onClick={() => { setEditing(card.id); setDraftFront(card.front); setDraftBack(card.back) }}>
                    <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <ConfirmButton
                    label="Delete"
                    disabled={pending}
                    onConfirm={() => {
                      const previous = cards
                      setCards(cards.filter((item) => item.id !== card.id))
                      startTransition(async () => {
                        const result = await removeCard({ id: card.id })
                        if (!result.ok) {
                          setCards(previous)
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
      <form
        className="composer composer-block"
        onSubmit={(event) => {
          event.preventDefault()
          const nextFront = front.trim()
          const nextBack = back.trim()
          if (!nextFront || !nextBack) return
          const id = crypto.randomUUID()
          const created = new Date().toISOString()
          const previous = cards
          setCards([...cards, { id, front: nextFront, back: nextBack, ease: 2.5, intervalDays: 0, repetitions: 0, dueAt: created, createdAt: created }])
          setFront('')
          setBack('')
          setError('')
          startTransition(async () => {
            const result = await addCard({ id, deckId: deck.id, front: nextFront, back: nextBack })
            if (!result.ok) {
              setCards(previous)
              setFront(nextFront)
              setBack(nextBack)
              setError(result.error)
              return
            }
            router.refresh()
          })
        }}
      >
        <label className="label" htmlFor="front">Front</label>
        <input id="front" name="front" maxLength={2000} placeholder="Front" value={front} onChange={(event) => setFront(event.target.value)} />
        <label className="label" htmlFor="back">Back</label>
        <input id="back" name="back" maxLength={2000} placeholder="Back" value={back} onChange={(event) => setBack(event.target.value)} />
        <div className="composer-bar">
          <span className="dim">New card</span>
          <button type="submit" className="primary" disabled={pending || front.trim().length === 0 || back.trim().length === 0}>Add</button>
        </div>
      </form>
      <p className="account"><a href="/">Decks</a></p>
    </div>
  )
}
