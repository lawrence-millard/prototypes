"use client"

import { useEffect, useState } from "react"

export function Shortcuts({ rows }: { rows: [string, string][] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        return
      }
      const el = event.target
      if (!(el instanceof HTMLElement)) return
      const typing = el.closest("input, textarea, select, [contenteditable='true']")
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === "?") {
        event.preventDefault()
        setOpen(true)
        return
      }
      if (event.key.toLowerCase() !== "n") return
      event.preventDefault()
      document.querySelector<HTMLElement>("[data-composer] input, [data-composer] textarea")?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!open) return null
  return (
    <div className="sheet" role="dialog" aria-label="Shortcuts">
      <div className="sheet-head">
        <h2>Shortcuts</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>×</button>
      </div>
      {rows.map(([key, name]) => (
        <div className="sheet-row" key={key}>
          <span>{name}</span>
          <kbd>{key}</kbd>
        </div>
      ))}
    </div>
  )
}
