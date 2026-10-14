'use client'

import { SignUp } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { clerkAppearance } from '@/components/clerk-appearance'

export function ClerkSignUp() {
  const dark = useDark()
  return (
    <main className="login-screen">
      <div className="clerk-auth">
        <div className="mark">
          <strong>Hookbox</strong>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/login"
          forceRedirectUrl="/"
          appearance={clerkAppearance(dark)}
        />
      </div>
    </main>
  )
}

function useDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === 'dark')
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return dark
}
