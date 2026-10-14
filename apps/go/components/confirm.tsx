"use client"

import { useFormStatus } from "react-dom"

export function Confirm({ label = "Delete" }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <button className="ghost" type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving" : label}</button>
  )
}
