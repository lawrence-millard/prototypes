'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addSecret, editSecret, removeSecret } from '@/app/(app)/actions'
import { ConfirmButton } from './confirm-button'
import { encryptSecret } from '@/lib/crypto'
import type { SecretItem } from '@/lib/types'

const choices = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
] as const

type Expiry = (typeof choices)[number]['value']

function whenLabel(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

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
        className="stack"
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
        <div className="field">
          <label className="label" htmlFor="secret">secret</label>
          <textarea id="secret" name="secret" maxLength={4000} autoComplete="off" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} />
        </div>
        <div className="field">
          <span className="label" id="expires-label">expires</span>
          <div className="modes" role="radiogroup" aria-labelledby="expires-label">
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
        </div>
        <button type="submit" className="primary" disabled={pending || text.length === 0}>create</button>
      </form>
      {link ? (
        <div className="field">
          <label className="label" htmlFor="link">link</label>
          <div className="inline">
            <input id="link" className="mono" readOnly value={link} />
            <button
              type="button"
              className="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(link).then(() => {
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 2000)
                }).catch(() => setCopied(false))
              }}
            >
              {copied ? 'copied' : 'copy'}
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="err" role="alert">{error}</p> : null}
      <h2 className="label">links</h2>
      {rows.length === 0 ? <p className="dim">no links</p> : (
        <div>
          {rows.map((item) => (
            <div className="item" key={item.id}>
              <div className="grow">
                <p className="mono">{item.id.slice(0, 6)}</p>
                <p className="dim mono">{whenLabel(item.expiresAt)}</p>
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
                    <div className="modes" role="radiogroup" aria-label="expires">
                      {choices.map((choice) => (
                        <button key={choice.value} type="button" role="radio" className="mode" aria-checked={draft === choice.value} onClick={() => setDraft(choice.value)}>
                          {choice.label}
                        </button>
                      ))}
                    </div>
                    <div className="actions">
                      <button type="submit" className="primary" disabled={pending}>save</button>
                      <button type="button" className="ghost" onClick={() => setEditing(null)}>cancel</button>
                    </div>
                  </form>
                ) : null}
              </div>
              {editing === item.id ? null : (
                <div className="ops">
                  <button type="button" className="text" disabled={pending} onClick={() => { setEditing(item.id); setDraft('1d') }}>edit</button>
                  <ConfirmButton
                    label="delete"
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
