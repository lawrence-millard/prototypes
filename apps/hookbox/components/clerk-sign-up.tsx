import { SignUp } from '@clerk/nextjs'
import { clerkAppearance } from '@/components/clerk-appearance'

export function ClerkSignUp() {
  return (
    <main className="login-screen">
      <div className="clerk-auth">
        <div className="mark">
          <strong>Hookbox</strong>
          <span>private</span>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/login"
          forceRedirectUrl="/"
          appearance={clerkAppearance}
        />
      </div>
    </main>
  )
}
