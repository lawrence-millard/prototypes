import { NextResponse } from "next/server"
import { z } from "zod"
import { hitLink } from "@/lib/data"
import { db } from "@/lib/db"
import { plain } from "@/lib/plain"
import { allowIp, clientIp } from "@/lib/rate"

const codeSchema = z.string().regex(/^[a-z0-9-]{3,32}$/)

export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params
  if (!codeSchema.safeParse(code).success) return plain("not found", 404)
  const ip = clientIp(request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"))
  if (!allowIp(ip)) return plain("slow down", 429)
  if (!process.env.DATABASE_URL) return plain("unavailable", 503)
  try {
    const url = await hitLink(await db(), code)
    if (!url) return plain("not found", 404)
    return NextResponse.redirect(url, { status: 302, headers: { "cache-control": "private, no-store" } })
  } catch {
    return plain("unavailable", 503)
  }
}
