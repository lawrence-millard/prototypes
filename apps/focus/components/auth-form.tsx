'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

function useDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      setDark(root.classList.contains('dark') || (!root.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches))
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', read)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', read)
    }
  }, [])
  return dark
}

export function AuthForm({ mode }: { mode: 'in' | 'up' }) {
  const dark = useDark()
  const fg = dark ? '#e9e9e9' : '#0b0b0b'
  const bg = dark ? '#000000' : '#f6f6f6'
  const mute = dark ? '#a2a2a2' : '#5a5a5a'
  const appearance = {
    variables: {
      colorPrimary: fg,
      colorBackground: bg,
      colorText: fg,
      colorTextSecondary: mute,
      colorInputBackground: bg,
      colorInputText: fg,
      colorNeutral: mute,
      borderRadius: '8px',
      fontFamily: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
      fontFamilyButtons: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
    },
    elements: {
      card: { boxShadow: 'none', border: '1px solid rgba(124,124,124,0.35)' },
      cardBox: { boxShadow: 'none' },
      footer: { boxShadow: 'none' },
      headerTitle: { fontSize: '20px', letterSpacing: '-0.4px' },
    },
  }

  if (mode === 'up') {
    return (
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        appearance={appearance}
      />
    )
  }

  return (
    <SignIn
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/"
      appearance={appearance}
    />
  )
}
