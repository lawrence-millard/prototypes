import type { Metadata } from 'next'
import Script from 'next/script'
import '@fontsource/open-runde/latin-500.css'
import '@fontsource/geist-mono/latin-400.css'
import './globals.css'

const themeBoot = `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');if(t==='light')document.documentElement.classList.add('light')}catch(e){}`

export const metadata: Metadata = {
  title: 'secret',
  description: 'One-time secret links',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">{themeBoot}</Script>
        {children}
      </body>
    </html>
  )
}
