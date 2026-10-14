"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { renderMarkdown } from "@/lib/markdown"
import type { State } from "@/lib/state"

export function Editor({
  action,
  id,
  title,
  body,
  errors,
}: {
  action: (state: State, formData: FormData) => Promise<State>
  id?: string
  title: string
  body: string
  errors: Record<string, string>
}) {
  const [state, formAction] = useActionState(action, null)
  const [text, setText] = useState(body)
  const message = state?.error ? errors[state.error] ?? "unavailable" : ""
  return (
    <form action={formAction} className="stack">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <label className="field">
        <span className="label">title</span>
        <input name="title" type="text" required maxLength={120} defaultValue={title} autoComplete="off" />
      </label>
      <label className="field">
        <span className="label">body</span>
        <textarea className="mono" name="body" maxLength={20000} value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      {message ? <p className="alert" role="alert">{message}</p> : null}
      <Submit />
      <div>
        <span className="label">preview</span>
        <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
      </div>
    </form>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "saving" : "save"}
    </button>
  )
}
