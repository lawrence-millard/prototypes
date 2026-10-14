"use client"

import { SignOutButton } from "@clerk/nextjs"

export function SignOut() {
  return (
    <SignOutButton redirectUrl="/sign-in">
      <button type="button" className="text">sign out</button>
    </SignOutButton>
  )
}
