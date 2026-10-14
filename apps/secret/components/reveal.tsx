'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { openSecret } from '@/app/(app)/actions'
import { decryptSecret } from '@/lib/crypto'

export function Reveal() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const [key, setKey] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [plain, setPlain] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    function read() {
      const raw = window.location.hash.replace(/^#/, '')
      if (!raw) {
        setKey(null)
      } else {
        try {
          const decoded = decodeURIComponent(raw)
          setKey(/^[A-Za-z0-9_-]{43}$/.test(decoded) ? decoded : null)
        } catch {
          setKey(null)
        }
      }
      setReady(true)
    }
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  if (!ready) return <p className="dim">loading</p>
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id) || !key) return <p className="dim">missing key.</p>
  if (plain != null) return <p className="secret">{plain}</p>

  return (
    <div className="stack">
      <button
        type="button"
        className="primary"
        disabled={pending}
        onClick={() => {
          setError('')
          startTransition(async () => {
            const result = await openSecret({ id })
            if (!result.ok) {
              setError(result.error)
              return
            }
            try {
              setPlain(await decryptSecret(result.data.ciphertext, result.data.iv, key))
            } catch {
              setError('could not open.')
            }
          })
        }}
      >
        open
      </button>
      {error ? <p className="err" role="alert">{error}</p> : null}
    </div>
  )
}
