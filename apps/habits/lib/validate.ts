import { z } from "zod"

const nameField = z.string().trim().min(1).max(40).refine((value) => !value.includes("\0"))

export function parseName(value: unknown) {
  const name = nameField.safeParse(value)
  if (!name.success) return { ok: false as const, error: "invalid" as const }
  return { ok: true as const, name: name.data }
}

export function parseId(value: unknown) {
  return z.string().uuid().safeParse(value)
}

export function parseToggle(input: { id: unknown; on: unknown; day: unknown }) {
  const id = parseId(input.id)
  const on = z.enum(["0", "1"]).safeParse(input.on)
  const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(input.day)
  if (!id.success || !on.success || !day.success) return { ok: false as const, error: "invalid" as const }
  return { ok: true as const, id: id.data, on: on.data === "1", day: day.data }
}
