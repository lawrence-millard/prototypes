import "server-only"

import { redirect } from "next/navigation"

export function clerkOn() {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
}

export async function currentUserId() {
  if (!clerkOn()) return null
  const { auth } = await import("@clerk/nextjs/server")
  const { userId } = await auth()
  return userId
}

export async function requireUserId() {
  const userId = await currentUserId()
  if (!userId) redirect("/sign-in")
  return userId
}
