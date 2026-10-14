import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { connection } from "next/server"
import { ThemeToggle } from "@/components/theme-toggle"
import "@fontsource/open-runde/latin-500.css"
import "@fontsource/geist-mono/latin-400.css"
import "@fontsource/geist-mono/latin-500.css"
import "./globals.css"

const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`

export const metadata: Metadata = {
  metadataBase: new URL("https://habits.millard.ink"),
  title: { default: "habits", template: "%s · habits" },
  description: "Habit tracker.",
  referrer: "no-referrer",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const body = (
    <>
      {children}
      <ThemeToggle />
    </>
  )
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {key ? (
          <ClerkProvider
            dynamic
            telemetry={false}
            signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"}
            signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"}
            signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/"}
            signUpFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/"}
          >
            {body}
          </ClerkProvider>
        ) : body}
      </body>
    </html>
  )
}
