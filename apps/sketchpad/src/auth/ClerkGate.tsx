import { ClerkFailed, ClerkLoaded, ClerkLoading, ClerkProvider, SignIn, useAuth } from '@clerk/clerk-react'
import { useEffect, type ReactNode } from 'react'
import { bindSync } from '../sync/client'
import { SignedOutLanding } from '../ui/Landing'
import { useTheme } from '../ui/ThemeToggle'
import { clerkAppearance } from './appearance'
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
        <SignedOutLanding auth={<p className="auth-note">Loading.</p>} />
      </ClerkLoading>
      <ClerkFailed>
        <SignedOutLanding auth={<p className="auth-note">Sign-in failed. Check the publishable key.</p>} />
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
  const theme = useTheme()
  return (
    <SignedOutLanding
      auth={
        <SignIn
          routing="virtual"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
          appearance={clerkAppearance(theme === 'dark')}
        />
      }
    />
  )
}
