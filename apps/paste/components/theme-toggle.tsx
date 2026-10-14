"use client"

import { Moon, Sun } from "lucide-react"
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
      {theme === "dark" ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
    </button>
  )
}
