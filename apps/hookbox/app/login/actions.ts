'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { clearSession, dummyPasswordWork, issueSession, passwordsMatch } from '@/lib/auth'
import { clientIp } from '@/lib/http'
import { sanitizeError } from '@/lib/errors'
import { clearLoginFailures, loginLocked, recordLoginFailure } from '@/lib/rate-limit'

export type LoginState = { error: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  if (username.length > 64 || password.length > 200 || password.length === 0) {
    return { error: 'Invalid username or password.' }
  }

  const ip = clientIp(await headers())
  try {
    if (await loginLocked(ip)) {
      await dummyPasswordWork(password)
      return { error: 'Too many attempts. Try again in 15 minutes.' }
    }
    const ok = await passwordsMatch(username, password)
    if (!ok) {
      const locked = await recordLoginFailure(ip)
      return {
        error: locked
          ? 'Too many attempts. Try again in 15 minutes.'
          : 'Invalid username or password.',
      }
    }
    await clearLoginFailures(ip)
    await issueSession()
  } catch (error) {
    console.error('login_failed', sanitizeError(error))
    return { error: 'Sign-in is unavailable.' }
  }
  redirect('/')
}

export async function logout(): Promise<void> {
  await clearSession()
  redirect('/login')
}
