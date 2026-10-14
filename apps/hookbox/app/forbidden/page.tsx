import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClerkSignOut } from '@/components/clerk-sign-out'
import { readSession } from '@/lib/auth'
import { clerkEnabled } from '@/lib/clerk-mode'

export const metadata: Metadata = { title: 'Not allowed' }
export const dynamic = 'force-dynamic'

export default async function ForbiddenPage() {
  if (!clerkEnabled()) {
    if (await readSession()) redirect('/')
    redirect('/login')
  }

  const { auth, currentUser } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  const user = userId ? await currentUser() : null
  const email = user?.primaryEmailAddress?.emailAddress

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="mark">
          <strong>Hookbox</strong>
        </div>
        <h1>Not allowed</h1>
        <p className="lede">{email ? `${email} is not on the list.` : 'This account is not on the list.'}</p>
        {userId ? <ClerkSignOut /> : <Link href="/login">Sign in</Link>}
      </section>
    </main>
  )
}
