import { SignIn } from '@clerk/nextjs'
import { clerkAppearance } from '@/components/clerk-appearance'

export function ClerkSignIn() {
  return (
    <main className="login-screen">
      <div className="clerk-auth">
        <div className="mark">
          <strong>Hookbox</strong>
          <span>private</span>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/sign-up"
          forceRedirectUrl="/"
          appearance={clerkAppearance}
        />
      </div>
    </main>
  )
}
