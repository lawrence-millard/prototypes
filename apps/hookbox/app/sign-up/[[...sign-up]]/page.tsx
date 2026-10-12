import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ClerkSignUp } from '@/components/clerk-sign-up'
import { clerkEnabled } from '@/lib/clerk-mode'

export const metadata: Metadata = { title: 'Create account' }
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  if (!clerkEnabled()) redirect('/login')
  return <ClerkSignUp />
}
