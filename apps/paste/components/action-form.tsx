"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import type { State } from "@/lib/state"

export function ActionForm({
  action,
  errors,
  children,
  className = "stack",
  composer = false,
}: {
  action: (state: State, formData: FormData) => Promise<State>
  errors: Record<string, string>
  children: React.ReactNode
  className?: string
  composer?: boolean
}) {
  const [state, formAction] = useActionState(action, null)
  const text = state?.error ? errors[state.error] ?? "Unavailable" : ""
  return (
    <form action={formAction} className={className} {...(composer ? { "data-composer": "" } : {})}>
      {children}
      {text ? <p className="alert" role="alert">{text}</p> : null}
    </form>
  )
}

export function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving" : label}
    </button>
  )
}
