'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addCard, editCard, editDeck, gradeCard, removeCard, removeDeck } from '@/app/(app)/actions'
import { ConfirmButton } from './confirm-button'
import { nextReview } from '@/lib/srs'
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

  return (
    <div className="stack">
      <div className="item" style={{ borderTop: 0, paddingTop: 0 }}>
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
              <input aria-label="name" maxLength={80} value={draftName} autoFocus onChange={(event) => setDraftName(event.target.value)} />
              <button type="submit" className="text" disabled={pending || draftName.trim().length === 0}>save</button>
              <button type="button" className="text" onClick={() => setRenaming(false)}>cancel</button>
            </form>
          ) : (
            <p className="title" style={{ fontSize: 16 }}>{name}</p>
          )}
        </div>
        {renaming ? null : (
          <div className="ops">
            <button type="button" className="text" disabled={pending} onClick={() => { setRenaming(true); setDraftName(name) }}>edit</button>
            <ConfirmButton
              label="delete"
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
          <p className="title">{current.front}</p>
          {shown ? <p className="secret">{current.back}</p> : (
            <button type="button" className="ghost" onClick={() => setShown(true)}>show</button>
          )}
          {shown ? (
            <div className="actions">
              <button type="button" className="ghost" disabled={pending} onClick={() => grade('again')}>again</button>
              <button ref={goodRef} type="button" className="primary" disabled={pending} onClick={() => grade('good')}>good</button>
              <button type="button" className="ghost" disabled={pending} onClick={() => grade('easy')}>easy</button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="dim">nothing due</p>
      )}
      {error ? <p className="err" role="alert">{error}</p> : null}
      <h2 className="label">cards</h2>
      {cards.length === 0 ? <p className="dim">no cards</p> : (
        <div>
          {cards.map((card) => (
            <div className="item" key={card.id}>
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
                    <label className="label" htmlFor={`front-${card.id}`}>front</label>
                    <textarea id={`front-${card.id}`} maxLength={2000} value={draftFront} onChange={(event) => setDraftFront(event.target.value)} />
                    <label className="label" htmlFor={`back-${card.id}`}>back</label>
                    <textarea id={`back-${card.id}`} maxLength={2000} value={draftBack} onChange={(event) => setDraftBack(event.target.value)} />
                    <div className="actions">
                      <button type="submit" className="primary" disabled={pending}>save</button>
                      <button type="button" className="ghost" onClick={() => setEditing(null)}>cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="title" style={{ fontSize: 16 }}>{card.front}</p>
                    <p className="dim mono">{gap(card)}</p>
                  </>
                )}
              </div>
              {editing === card.id ? null : (
                <div className="ops">
                  <button type="button" className="text" disabled={pending} onClick={() => { setEditing(card.id); setDraftFront(card.front); setDraftBack(card.back) }}>edit</button>
                  <ConfirmButton
                    label="delete"
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
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          const nextFront = front.trim()
          const nextBack = back.trim()
          if (!nextFront || !nextBack) return
          const id = crypto.randomUUID()
          const now = new Date().toISOString()
          const previous = cards
          setCards([...cards, { id, front: nextFront, back: nextBack, ease: 2.5, intervalDays: 0, repetitions: 0, dueAt: now, createdAt: now }])
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
        <div className="field">
          <label className="label" htmlFor="front">front</label>
          <textarea id="front" name="front" maxLength={2000} value={front} onChange={(event) => setFront(event.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="back">back</label>
          <textarea id="back" name="back" maxLength={2000} value={back} onChange={(event) => setBack(event.target.value)} />
        </div>
        <button type="submit" className="primary" disabled={pending || front.trim().length === 0 || back.trim().length === 0}>add</button>
      </form>
      <p className="account"><a href="/">decks</a></p>
    </div>
  )
}
