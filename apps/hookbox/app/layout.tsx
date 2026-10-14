import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import { connection } from 'next/server'
import { ThemeToggle } from '@/components/theme-toggle'
import { clerkEnabled } from '@/lib/clerk-mode'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://hookbox.millard.ink'),
  title: { default: 'Hookbox', template: '%s · Hookbox' },
  description: 'Webhook inbox',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const nonce = (await headers()).get('x-nonce') ?? undefined
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
      <body>
        {nonce ? (
          <Script id="theme" nonce={nonce} strategy="beforeInteractive">
            {`try{var t=localStorage.getItem("theme");var d=document.documentElement;if(t==="dark"||t==="light")d.dataset.theme=t;else if(matchMedia("(prefers-color-scheme: dark)").matches)d.dataset.theme="dark"}catch(e){}`}
          </Script>
        ) : null}
        <ThemeToggle />
        {content}
      </body>
    </html>
  )
}
