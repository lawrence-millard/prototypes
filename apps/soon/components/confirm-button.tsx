'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export function ConfirmButton({
  label,
  onConfirm,
  disabled,
}: {
  label: string
  onConfirm: () => void
  disabled?: boolean
}) {
  const [hot, setHot] = useState(false)

  return (
    <button
      type="button"
      className={hot ? 'ghost' : 'icon'}
      disabled={disabled}
      aria-pressed={hot}
      aria-label={hot ? 'Confirm' : label}
      onClick={() => {
        if (!hot) {
          setHot(true)
          return
        }
        setHot(false)
        onConfirm()
      }}
      onBlur={() => setHot(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setHot(false)
      }}
    >
      {hot ? 'Confirm' : <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />}
    </button>
  )
}
