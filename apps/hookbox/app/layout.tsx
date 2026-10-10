import type { Metadata } from 'next'
import { connection } from 'next/server'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Hookbox', template: '%s · Hookbox' },
  description: 'Private webhook inbox',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
