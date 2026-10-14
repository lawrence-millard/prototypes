import { Suspense } from "react"
import type { Metadata } from "next"
import { ClerkAuth } from "@/components/clerk-auth"
import { Header } from "@/components/header"
import { Skeleton } from "@/components/skeleton"
import { currentUserId } from "@/lib/auth"

export const metadata: Metadata = { title: "sign in" }

export default async function SignInPage() {
  const signedIn = Boolean(await currentUserId())
  const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  return (
    <main className="frame">
      <Header name="paste" mark="p" signedIn={signedIn} href="/sign-up" label="Sign up" />
      {enabled ? (
        <Suspense fallback={<Skeleton />}>
          <ClerkAuth mode="sign-in" />
        </Suspense>
      ) : null}
    </main>
  )
}
