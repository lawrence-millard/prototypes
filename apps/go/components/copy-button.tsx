"use client"

import { useState } from "react"

export function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="ghost"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setDone(true)
          window.setTimeout(() => setDone(false), 1200)
        }, () => undefined)
      }}
    >
      {done ? "copied" : "copy"}
    </button>
  )
}
