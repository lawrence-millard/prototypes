import { lazy, Suspense, type ReactNode } from 'react'
import { isPlausibleClerkPublishableKey, LOCAL_OWNER_ID, readClerkPublishableKey } from './config'
import { OwnerProvider } from './session'
import { SignedOutLanding } from '../ui/Landing'
import { FullScreenMessage } from '../ui/messages'

const ClerkGate = lazy(() => import('./ClerkGate'))

export function AuthGate({ children }: { children: ReactNode }) {
  const key = readClerkPublishableKey()
  if (!key && import.meta.env.DEV && new URLSearchParams(window.location.search).get('signed-out') === '1') {
    return <SignedOutLanding auth={<p className="auth-note">Sign in to sync boards.</p>} />
  }
  if (!key) {
    return (
      <OwnerProvider ownerId={LOCAL_OWNER_ID} mode="local">
        {children}
      </OwnerProvider>
    )
  }
  if (!isPlausibleClerkPublishableKey(key)) {
    return (
      <FullScreenMessage
        title="Sign-in is misconfigured"
        body="The publishable key is invalid."
      />
    )
  }
  return (
    <Suspense fallback={<SignedOutLanding auth={<p className="auth-note">Loading.</p>} />}>
      <ClerkGate publishableKey={key}>{children}</ClerkGate>
    </Suspense>
  )
}
