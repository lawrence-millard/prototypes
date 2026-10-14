'use client'

import { useState } from 'react'

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
      className="text"
      disabled={disabled}
      aria-pressed={hot}
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
      {hot ? 'confirm' : label}
    </button>
  )
}
