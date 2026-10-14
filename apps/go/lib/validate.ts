import { z } from "zod"
import { validCode } from "./code"
import { safeHttpUrl } from "./url"

const urlField = z.string().trim().min(1).max(2000).refine((value) => !value.includes("\0"))
const codeField = z.string().trim().max(32)

export function parseLink(input: { url: unknown; code: unknown }) {
  const url = urlField.safeParse(input.url)
  const code = codeField.safeParse(input.code ?? "")
  if (!url.success) return { ok: false as const, error: "invalid" as const }
  if (!code.success) return { ok: false as const, error: "code" as const }
  const href = safeHttpUrl(url.data)
  if (!href) return { ok: false as const, error: "invalid" as const }
  const slug = code.data.toLowerCase()
  if (slug && !validCode(slug)) return { ok: false as const, error: "code" as const }
  return { ok: true as const, url: href, code: slug }
}

export function parseId(value: unknown) {
  return z.string().uuid().safeParse(value)
}
