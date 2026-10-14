"use client"

import { useEffect, useState } from "react"

function current() {
  const stored = document.documentElement.dataset.theme
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    setTheme(current())
  }, [])

  function toggle() {
    const next = current() === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    localStorage.setItem("theme", next)
    setTheme(next)
  }

  return (
    <button type="button" className="theme" aria-label="theme" aria-pressed={theme === "dark"} onClick={toggle}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  )
}

function Moon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M8 1.5a6.5 6.5 0 1 0 6.3 8.2 5 5 0 1 1-6-6.2A6.5 6.5 0 0 0 8 1.5Z" />
    </svg>
  )
}

function Sun() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
      <path stroke="currentColor" strokeWidth="1.4" d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" />
    </svg>
  )
}
