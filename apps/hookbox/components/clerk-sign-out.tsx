'use client'

import { SignOutButton } from '@clerk/nextjs'

export function ClerkSignOut() {
  return (
    <SignOutButton redirectUrl="/login">
      <button className="text-button" type="button">
        Sign out
      </button>
    </SignOutButton>
  )
}
