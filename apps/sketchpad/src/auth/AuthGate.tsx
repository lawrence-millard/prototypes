import { lazy, Suspense, type ReactNode } from 'react'
import { isPlausibleClerkPublishableKey, LOCAL_OWNER_ID, readClerkPublishableKey } from './config'
import { OwnerProvider } from './session'
import { FullScreenMessage } from '../ui/messages'

const ClerkGate = lazy(() => import('./ClerkGate'))

export function AuthGate({ children }: { children: ReactNode }) {
  const key = readClerkPublishableKey()
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
        body="VITE_CLERK_PUBLISHABLE_KEY is set, but it does not look like a Clerk publishable key. Remove it to use Sketchpad privately on this browser, or paste the publishable key from your existing Clerk application."
      />
    )
  }
  return (
    <Suspense
      fallback={
        <FullScreenMessage
          title="Loading sign-in…"
          body="Checking the optional Clerk sign-in. Board contents are not sent."
        />
      }
    >
      <ClerkGate publishableKey={key}>{children}</ClerkGate>
    </Suspense>
  )
}
