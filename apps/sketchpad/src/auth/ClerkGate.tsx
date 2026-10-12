import { ClerkFailed, ClerkLoaded, ClerkLoading, ClerkProvider, SignIn, useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { FullScreenMessage } from '../ui/messages'
import { OwnerProvider } from './session'

export default function ClerkGate({
  publishableKey,
  children,
}: {
  publishableKey: string
  children: ReactNode
}) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkLoading>
        <FullScreenMessage
          title="Checking sign-in…"
          body="A Clerk publishable key is set. Board contents stay in this browser and are not uploaded."
        />
      </ClerkLoading>
      <ClerkFailed>
        <FullScreenMessage
          title="Sign-in could not be loaded"
          body="Clerk did not load. Check the publishable key from your shared Clerk application, or clear VITE_CLERK_PUBLISHABLE_KEY to use Sketchpad without an account."
        />
      </ClerkFailed>
      <ClerkLoaded>
        <ClerkSession>{children}</ClerkSession>
      </ClerkLoaded>
    </ClerkProvider>
  )
}

function ClerkSession({ children }: { children: ReactNode }) {
  const { isSignedIn, userId } = useAuth()
  if (!isSignedIn || !userId) return <SignInScreen />
  return (
    <OwnerProvider ownerId={userId} mode="clerk">
      {children}
    </OwnerProvider>
  )
}

function SignInScreen() {
  return (
    <main className="signin">
      <div className="signin-copy">
        <h1>Sign in to Sketchpad</h1>
        <p>
          A Clerk publishable key is set, so this browser asks you to sign in before opening boards.
          Use the same Clerk application you already use for your other apps. Boards still stay in
          IndexedDB on this device, separated by account. They are not uploaded.
        </p>
        <p>To use Sketchpad without an account, clear VITE_CLERK_PUBLISHABLE_KEY and reload.</p>
      </div>
      <SignIn
        routing="virtual"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
        appearance={{
          variables: {
            colorPrimary: '#145c3e',
            colorBackground: '#fbf8f3',
            colorText: '#1a1814',
            colorInputBackground: '#fffdf8',
            colorInputText: '#1a1814',
            borderRadius: '8px',
            fontFamily: 'Segoe UI, Helvetica Neue, sans-serif',
          },
        }}
      />
    </main>
  )
}
