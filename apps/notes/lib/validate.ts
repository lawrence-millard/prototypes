import { z } from "zod"

const titleField = z.string().trim().min(1).max(120).refine((value) => !value.includes("\0"))
const bodyField = z.string().max(20_000).refine((value) => !value.includes("\0"))

export function parseNote(input: { title: unknown; body: unknown }) {
  const title = titleField.safeParse(input.title)
  const body = bodyField.safeParse(typeof input.body === "string" ? input.body : "")
  if (!title.success || !body.success) return { ok: false as const, error: "invalid" as const }
  return { ok: true as const, title: title.data, body: body.data }
}

export function parseId(value: unknown) {
  return z.string().uuid().safeParse(value)
}
