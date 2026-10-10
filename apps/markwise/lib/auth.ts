import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { enrolments, users, type UserRow } from "@/lib/schema";
import { DEFAULT_ENROLMENTS, DEMO_USER_ID, DEMO_EXAM_DATE, SUBJECT_ORDER } from "@/lib/subjects";

export function hasClerk() {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export const getAuthIdentity = cache(async (): Promise<{ id: string; suggestedName?: string } | null> => {
  if (hasClerk()) {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const session = await auth();
    if (!session.userId) return null;
    const person = await currentUser();
    const suggestedName = person?.firstName?.trim() || undefined;
    return { id: session.userId, suggestedName };
  }
  return { id: DEMO_USER_ID };
});

export async function requirePageUser() {
  const identity = await getAuthIdentity();
  if (!identity) redirect("/sign-in");
  return ensureUser(identity);
}

export async function requireApiUser() {
  const identity = await getAuthIdentity();
  if (!identity) return null;
  return ensureUser(identity);
}

async function ensureUser(identity: { id: string; suggestedName?: string }): Promise<UserRow> {
  const db = await getDb();
  const existing = await db.select().from(users).where(eq(users.id, identity.id));
  if (existing[0]) {
    if (!existing[0].displayName && identity.suggestedName) {
      await db.update(users).set({ displayName: identity.suggestedName }).where(eq(users.id, identity.id));
      return { ...existing[0], displayName: identity.suggestedName };
    }
    return existing[0];
  }

  await db.insert(users).values({
    id: identity.id,
    displayName: identity.suggestedName ?? "",
    examDate: DEMO_EXAM_DATE,
    onboarded: false,
    xp: 0,
    streak: 0,
  });
  await db.insert(enrolments).values(
    SUBJECT_ORDER.map((subject) => ({
      userId: identity.id,
      subject,
      board: DEFAULT_ENROLMENTS[subject].board,
      specCode: DEFAULT_ENROLMENTS[subject].specCode,
      targetGrade: DEFAULT_ENROLMENTS[subject].target,
    })),
  );
  const created = await db.select().from(users).where(eq(users.id, identity.id));
  return created[0];
}
