"use client"

import { Check, Copy as CopyIcon } from "lucide-react"
import { useState } from "react"

export function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={done ? "Copied" : "Copy link"}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setDone(true)
          window.setTimeout(() => setDone(false), 1200)
        }, () => undefined)
      }}
    >
      {done ? <Check size={16} strokeWidth={1.5} /> : <CopyIcon size={16} strokeWidth={1.5} />}
    </button>
  )
}
