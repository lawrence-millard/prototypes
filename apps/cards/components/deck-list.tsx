'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDeck, editDeck, removeDeck } from '@/app/(app)/actions'
import { ConfirmButton } from './confirm-button'
import type { Deck } from '@/lib/types'

export function DeckList({ decks, loadError }: { decks: Deck[]; loadError: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rows, setRows] = useState(decks)
  const [name, setName] = useState('')
  const [error, setError] = useState(loadError)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => { setRows(decks) }, [decks])

  return (
    <div className="stack">
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = name.trim().replace(/\s+/g, ' ')
          if (!trimmed) return
          const id = crypto.randomUUID()
          const previous = rows
          setRows([{ id, name: trimmed, cards: 0, due: 0 }, ...rows])
          setName('')
          setError('')
          startTransition(async () => {
            const result = await addDeck({ id, name: trimmed })
            if (!result.ok) {
              setRows(previous)
              setName(trimmed)
              setError(result.error)
              return
            }
            router.refresh()
          })
        }}
      >
        <div className="field">
          <label className="label" htmlFor="deck-name">name</label>
          <div className="inline">
            <input id="deck-name" name="name" maxLength={80} autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} />
            <button type="submit" className="primary" disabled={pending || name.trim().length === 0}>add</button>
          </div>
        </div>
      </form>
      {error ? <p className="err" role="alert">{error}</p> : null}
      {rows.length === 0 ? <p className="dim">no decks</p> : (
        <div>
          {rows.map((deck) => (
            <div className="item" key={deck.id}>
              <div className="grow">
                {editing === deck.id ? (
                  <form
                    className="inline"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const next = draft.trim().replace(/\s+/g, ' ')
                      if (!next) return
                      const previous = rows
                      setRows(rows.map((item) => item.id === deck.id ? { ...item, name: next } : item))
                      setEditing(null)
                      startTransition(async () => {
                        const result = await editDeck({ id: deck.id, name: next })
                        if (!result.ok) {
                          setRows(previous)
                          setError(result.error)
                          return
                        }
                        router.refresh()
                      })
                    }}
                  >
                    <input aria-label="name" maxLength={80} value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} />
                    <button type="submit" className="text" disabled={pending || draft.trim().length === 0}>save</button>
                    <button type="button" className="text" onClick={() => setEditing(null)}>cancel</button>
                  </form>
                ) : (
                  <>
                    <p className="title" style={{ fontSize: 16 }}><a href={`/deck/${deck.id}`}>{deck.name}</a></p>
                    <p className="dim mono">{deck.due} due · {deck.cards}</p>
                  </>
                )}
              </div>
              {editing === deck.id ? null : (
                <div className="ops">
                  <button type="button" className="text" disabled={pending} onClick={() => { setEditing(deck.id); setDraft(deck.name) }}>edit</button>
                  <ConfirmButton
                    label="delete"
                    disabled={pending}
                    onConfirm={() => {
                      const previous = rows
                      setRows(rows.filter((item) => item.id !== deck.id))
                      startTransition(async () => {
                        const result = await removeDeck({ id: deck.id })
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
