'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Pencil } from 'lucide-react'
import { addSecret, editSecret, removeSecret } from '@/app/(app)/actions'
import { relativeTime } from '@/lib/relative'
import { encryptSecret } from '@/lib/crypto'
import { ConfirmButton } from './confirm-button'
import type { SecretItem } from '@/lib/types'

const choices = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
] as const

type Expiry = (typeof choices)[number]['value']

export function Composer({ secrets, loadError }: { secrets: SecretItem[]; loadError: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [text, setText] = useState('')
  const [expiresIn, setExpiresIn] = useState<Expiry>('1d')
  const [rows, setRows] = useState(secrets)
  const [error, setError] = useState(loadError)
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Expiry>('1d')

  useEffect(() => { setRows(secrets) }, [secrets])

  return (
    <div className="stack">
      <form
        className="composer composer-block"
        onSubmit={(event) => {
          event.preventDefault()
          if (text.length < 1 || text.length > 4000) return
          const plaintext = text
          const choice = expiresIn
          setError('')
          setCopied(false)
          startTransition(async () => {
            try {
              const sealed = await encryptSecret(plaintext)
              const result = await addSecret({ ciphertext: sealed.ciphertext, iv: sealed.iv, expiresIn: choice })
              if (!result.ok) {
                setError(result.error)
                return
              }
              setText('')
              setLink(`${location.origin}/v/${result.data.id}#${sealed.key}`)
              router.refresh()
            } catch {
              setError('could not save.')
            }
          })
        }}
      >
        <label className="label" htmlFor="secret">Secret</label>
        <textarea id="secret" name="secret" maxLength={4000} autoComplete="off" spellCheck={false} placeholder="Write it here" value={text} onChange={(event) => setText(event.target.value)} />
        <div className="composer-bar">
          <div className="modes" role="radiogroup" aria-label="Expires">
            {choices.map((choice) => (
              <button
                key={choice.value}
                type="button"
                role="radio"
                className="mode"
                aria-checked={expiresIn === choice.value}
                onClick={() => setExpiresIn(choice.value)}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <button type="submit" className="primary" disabled={pending || text.length === 0}>Create</button>
        </div>
      </form>
      {link ? (
        <div className="composer">
          <label className="label" htmlFor="link">Link</label>
          <input id="link" className="mono" readOnly value={link} />
          <button
            type="button"
            className="icon"
            aria-label={copied ? 'Copied' : 'Copy'}
            onClick={() => {
              void navigator.clipboard.writeText(link).then(() => {
                setCopied(true)
                window.setTimeout(() => setCopied(false), 2000)
              }).catch(() => setCopied(false))
            }}
          >
            {copied ? <Check size={16} strokeWidth={1.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}
          </button>
        </div>
      ) : null}
      {error ? <p className="err" role="alert">{error}</p> : null}
      <h2 className="label">Links</h2>
      {rows.length === 0 ? <div className="empty"><p>No links</p></div> : (
        <div className="list">
          {rows.map((item) => (
            <div className="row" key={item.id}>
              <div className="grow">
                <p className="row-title mono">{item.id.slice(0, 6)}</p>
                <p className="dim">expires {relativeTime(item.expiresAt)} · created {relativeTime(item.createdAt)}</p>
                {editing === item.id ? (
                  <form
                    className="stack"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const choice = draft
                      setEditing(null)
                      startTransition(async () => {
                        const result = await editSecret({ id: item.id, expiresIn: choice })
                        if (!result.ok) {
                          setError(result.error)
                          return
                        }
                        router.refresh()
                      })
                    }}
                  >
                    <div className="modes" role="radiogroup" aria-label="Expires">
                      {choices.map((choice) => (
                        <button key={choice.value} type="button" role="radio" className="mode" aria-checked={draft === choice.value} onClick={() => setDraft(choice.value)}>
                          {choice.label}
                        </button>
                      ))}
                    </div>
                    <div className="actions">
                      <button type="submit" className="primary" disabled={pending}>Save</button>
                      <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </form>
                ) : null}
              </div>
              {editing === item.id ? null : (
                <div className="ops">
                  <button type="button" className="icon" aria-label="Edit" disabled={pending} onClick={() => { setEditing(item.id); setDraft('1d') }}>
                    <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <ConfirmButton
                    label="Delete"
                    disabled={pending}
                    onConfirm={() => {
                      const previous = rows
                      setRows(rows.filter((row) => row.id !== item.id))
                      startTransition(async () => {
                        const result = await removeSecret({ id: item.id })
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
