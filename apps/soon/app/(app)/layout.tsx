import { ClerkProvider } from '@clerk/nextjs'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
      {children}
    </ClerkProvider>
  )
}
