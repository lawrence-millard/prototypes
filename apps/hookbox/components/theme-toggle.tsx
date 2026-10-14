'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  media.addEventListener('change', onStoreChange)
  return () => {
    observer.disconnect()
    media.removeEventListener('change', onStoreChange)
  }
}

function snapshot(): Theme {
  const value = document.documentElement.dataset.theme
  if (value === 'dark' || value === 'light') return value
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'light' as Theme)

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  }

  const dark = theme === 'dark'
  return (
    <button type="button" className="theme-toggle" aria-label={dark ? 'Light theme' : 'Dark theme'} onClick={toggle}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {dark ? (
          <circle cx="8" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        ) : (
          <circle cx="8" cy="8" r="3.25" fill="currentColor" />
        )}
      </svg>
    </button>
  )
}
