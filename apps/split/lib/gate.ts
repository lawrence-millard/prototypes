import "server-only";

import { currentUserId } from "@/lib/auth";
import { actionError } from "@/lib/errors";
import { allowBucket } from "@/lib/rate-limit";

export type Gate = { ok: true; userId: string } | { ok: false; error: string };

export async function writer(): Promise<Gate> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in required." };
  try {
    if (!(await allowBucket(userId, "write", 30))) return { ok: false, error: "Too many requests." };
  } catch (error) {
    return { ok: false, error: actionError(error).error ?? "Could not save." };
  }
  return { ok: true, userId };
}
