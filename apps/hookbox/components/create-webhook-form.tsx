'use client'

import { useActionState } from 'react'
import { createWebhookAction } from '@/app/(dash)/actions'
import { RevealUrl } from './reveal-url'

export function CreateWebhookForm() {
  const [state, action, pending] = useActionState(createWebhookAction, null)
  return (
    <form action={action} className="stack" id="create">
      <label htmlFor="webhook-name">Name</label>
      <input id="webhook-name" name="name" required maxLength={80} autoComplete="off" />
      <button className="primary" type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create webhook'}
      </button>
      {state?.error ? <p className="error" role="alert">{state.error}</p> : null}
      {state?.url ? <RevealUrl url={state.url} /> : null}
    </form>
  )
}
