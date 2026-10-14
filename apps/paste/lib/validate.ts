import { z } from "zod"
import { expiries } from "./time"

const bodyField = z.string().min(1).max(20_000).refine((value) => !value.includes("\0") && value.trim().length > 0)
const expiryField = z.enum(expiries)

export function parsePaste(input: { body: unknown; expiry: unknown }) {
  const body = bodyField.safeParse(input.body)
  const expiry = expiryField.safeParse(input.expiry)
  if (!body.success || !expiry.success) return { ok: false as const, error: "invalid" as const }
  return { ok: true as const, body: body.data, expiry: expiry.data }
}

export function parseBody(value: unknown) {
  const body = bodyField.safeParse(value)
  if (!body.success) return { ok: false as const, error: "invalid" as const }
  return { ok: true as const, body: body.data }
}

export function parseId(value: unknown) {
  return z.string().uuid().safeParse(value)
}
