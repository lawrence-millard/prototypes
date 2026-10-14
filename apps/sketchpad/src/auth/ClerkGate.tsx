import { ClerkFailed, ClerkLoaded, ClerkLoading, ClerkProvider, SignIn, useAuth } from '@clerk/clerk-react'
import { useEffect, type ReactNode } from 'react'
import { bindSync } from '../sync/client'
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
        <FullScreenMessage title="Sign in" body="Loading." />
      </ClerkLoading>
      <ClerkFailed>
        <FullScreenMessage
          title="Sign-in failed"
          body="Check the publishable key."
        />
      </ClerkFailed>
      <ClerkLoaded>
        <ClerkSession>{children}</ClerkSession>
      </ClerkLoaded>
    </ClerkProvider>
  )
}

function ClerkSession({ children }: { children: ReactNode }) {
  const { isSignedIn, userId, getToken } = useAuth()
  useEffect(() => {
    if (!isSignedIn || !userId) {
      bindSync(null)
      return
    }
    bindSync(() => getToken())
    return () => bindSync(null)
  }, [getToken, isSignedIn, userId])
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
      <p className="brand-name">Sketchpad</p>
      <SignIn
        routing="virtual"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
        appearance={{
          variables: {
            colorPrimary: '#0b0b0b',
            colorBackground: '#f6f6f6',
            colorText: '#0b0b0b',
            colorInputBackground: '#f6f6f6',
            colorInputText: '#0b0b0b',
            colorNeutral: '#5a5a5a',
            borderRadius: '8px',
            fontFamily: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
          },
        }}
      />
    </main>
  )
}
