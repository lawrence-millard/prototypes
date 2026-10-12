import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { clerkEnabled } from '@/lib/clerk-mode'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Hookbox', template: '%s · Hookbox' },
  description: 'Private webhook inbox',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const content = clerkEnabled() ? (
    <ClerkProvider
      dynamic
      signInUrl="/login"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      {children}
    </ClerkProvider>
  ) : (
    children
  )
  return (
    <html lang="en">
      <body>{content}</body>
    </html>
  )
}
