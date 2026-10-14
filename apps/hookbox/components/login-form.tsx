'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/login/actions'

const initial: LoginState = { error: '' }

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial)
  return (
    <form action={action} className="stack">
      <label htmlFor="username">Username</label>
      <input id="username" name="username" autoComplete="username" required maxLength={64} />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={200}
      />
      <button className="primary" type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      {state.error ? <p className="error" role="alert">{state.error}</p> : null}
    </form>
  )
}
