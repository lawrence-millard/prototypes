import type { Metadata } from 'next'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="mark">
          <strong>Hookbox</strong>
          <span>private</span>
        </div>
        <p className="lede">One inbox for the webhooks you create. Nothing here is public.</p>
        <LoginForm />
      </section>
    </main>
  )
}
