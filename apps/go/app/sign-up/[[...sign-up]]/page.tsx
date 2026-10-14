import { Suspense } from "react"
import type { Metadata } from "next"
import { ClerkAuth } from "@/components/clerk-auth"
import { Header } from "@/components/header"
import { Skeleton } from "@/components/skeleton"
import { currentUserId } from "@/lib/auth"

export const metadata: Metadata = { title: "sign up" }

export default async function SignUpPage() {
  const signedIn = Boolean(await currentUserId())
  const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  return (
    <main className="frame">
      <Header name="go" mark="g" signedIn={signedIn} href="/sign-in" label="Sign in" />
      {enabled ? (
        <Suspense fallback={<Skeleton />}>
          <ClerkAuth mode="sign-up" />
        </Suspense>
      ) : null}
    </main>
  )
}
