import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LoginForm } from '@/components/login-form'
import { ClerkSignIn } from '@/components/clerk-sign-in'
import { clerkEnabled } from '@/lib/clerk-mode'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ 'sign-in'?: string[] }>
}) {
  const { 'sign-in': rest } = await params
  if (!clerkEnabled()) {
    if (rest?.length) notFound()
    return (
      <main className="login-screen">
        <section className="login-card">
          <div className="mark">
            <strong>Hookbox</strong>
          </div>
          <LoginForm />
        </section>
      </main>
    )
  }
  return <ClerkSignIn />
}
