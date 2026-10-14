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
  hint,
}: {
  action: (state: State, formData: FormData) => Promise<State>
  id?: string
  title: string
  body: string
  errors: Record<string, string>
  hint: string
}) {
  const [state, formAction] = useActionState(action, null)
  const [text, setText] = useState(body)
  const message = state?.error ? errors[state.error] ?? "Unavailable" : ""
  return (
    <div className="stack">
      <form action={formAction} className="surface" data-composer="">
        {id ? <input type="hidden" name="id" value={id} /> : null}
        <label>
          <span className="field-label">Title</span>
          <input className="title-input" name="title" type="text" required maxLength={120} defaultValue={title} autoComplete="off" placeholder="Note title" />
        </label>
        <label className="split">
          <span className="field-label">Body</span>
          <textarea className="mono" name="body" maxLength={20000} value={text} placeholder="Write in markdown" onChange={(event) => setText(event.target.value)} />
        </label>
        {message ? <p className="alert" role="alert">{message}</p> : null}
        <div className="composer-foot">
          <span className="hint"><kbd>N</kbd> {hint}</span>
          <Submit />
        </div>
      </form>
      {text.trim() ? (
        <section className="preview-block">
          <span className="field-label">Preview</span>
          <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
        </section>
      ) : null}
    </div>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving" : "Save"}
    </button>
  )
}
