import "server-only";

import { redirect } from "next/navigation";

const USER_ID = /^[A-Za-z0-9_]{1,128}$/;

export function hasClerk(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export async function currentUserId(): Promise<string | null> {
  if (!hasClerk()) return null;
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId || !USER_ID.test(userId)) return null;
  return userId;
}

export async function requireUserId(): Promise<string> {
  const userId = await currentUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}
