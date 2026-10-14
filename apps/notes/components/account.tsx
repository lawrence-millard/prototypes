"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { clerkAppearance, useDark } from "./appearance"

export function Account() {
  const dark = useDark()
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <UserButton appearance={clerkAppearance(dark)} showName />
  }
  return (
    <details className="menu">
      <summary className="who" aria-label="Account">
        <span className="who-name">You</span>
        <span className="avatar" aria-hidden="true">Y</span>
      </summary>
      <div className="menu-pop">
        <p>Signed in</p>
        <Link href="/sign-in">Sign out</Link>
      </div>
    </details>
  )
}
