"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import type { State } from "@/lib/state"

export function ActionForm({
  action,
  submit,
  errors,
  children,
}: {
  action: (state: State, formData: FormData) => Promise<State>
  submit: string
  errors: Record<string, string>
  children: React.ReactNode
}) {
  const [state, formAction] = useActionState(action, null)
  const text = state?.error ? errors[state.error] ?? "unavailable" : ""
  return (
    <form action={formAction} className="stack">
      {children}
      {text ? <p className="alert" role="alert">{text}</p> : null}
      <Submit label={submit} />
    </form>
  )
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "saving" : label}
    </button>
  )
}
