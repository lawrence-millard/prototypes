'use client'

import { SignOutButton } from '@clerk/nextjs'

export function Account({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) {
    return (
      <p className="account">
        <a href="/sign-in">sign in</a>
      </p>
    )
  }

  return (
    <p className="account">
      <SignOutButton>
        <button type="button" className="text">sign out</button>
      </SignOutButton>
    </p>
  )
}
