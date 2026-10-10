'use client'

import { useActionState } from 'react'
import { regenerateWebhookAction, renameWebhookAction } from '@/app/(dash)/actions'
import { RevealUrl } from './reveal-url'

export function WebhookControls({ id, name }: { id: string; name: string }) {
  const [renamed, rename, renaming] = useActionState(renameWebhookAction, null)
  const [regenerated, regenerate, regenerating] = useActionState(regenerateWebhookAction, null)
  return (
    <div className="controls">
      <form action={rename} className="row-form" key={name}>
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`rename-${id}`}>
          Name
        </label>
        <input id={`rename-${id}`} name="name" defaultValue={name} required maxLength={80} />
        <button className="ghost" type="submit" disabled={renaming}>
          {renaming ? 'Saving…' : 'Rename'}
        </button>
      </form>
      {renamed?.error ? <p className="error" role="alert">{renamed.error}</p> : null}
      <form action={regenerate}>
        <input type="hidden" name="id" value={id} />
        <button className="ghost" type="submit" disabled={regenerating}>
          {regenerating ? 'Regenerating…' : 'Regenerate token'}
        </button>
      </form>
      {regenerated?.error ? <p className="error" role="alert">{regenerated.error}</p> : null}
      {regenerated?.url ? <RevealUrl url={regenerated.url} /> : null}
    </div>
  )
}
