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
        body="The publishable key is invalid."
      />
    )
  }
  return (
    <Suspense
      fallback={
        <FullScreenMessage
          title="Sign in"
          body="Loading."
        />
      }
    >
      <ClerkGate publishableKey={key}>{children}</ClerkGate>
    </Suspense>
  )
}
