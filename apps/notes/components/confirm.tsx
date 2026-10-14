"use client"

import { useFormStatus } from "react-dom"

export function Confirm() {
  const { pending } = useFormStatus()
  return (
    <button className="ghost" type="submit" disabled={pending} aria-busy={pending}>confirm</button>
  )
}
