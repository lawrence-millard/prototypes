"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { enrolments, users } from "@/lib/schema";
import { findBoard, GRADES, isSubjectId } from "@/lib/subjects";

export async function saveProfile(formData: FormData) {
  const user = await requirePageUser();
  const name = String(formData.get("name") ?? "")
    .replace(/[\r\n\t]/g, " ")
    .trim()
    .slice(0, 40);
  const examDate = String(formData.get("examDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) redirect("/onboarding?step=1&error=date");
  const db = await getDb();
  await db
    .update(users)
    .set({ displayName: name || user.displayName, examDate })
    .where(eq(users.id, user.id));
  revalidatePath("/onboarding");
  redirect("/onboarding?step=2");
}

export async function updateBoard(formData: FormData) {
  const user = await requirePageUser();
  const subject = String(formData.get("subject") ?? "");
  const specCode = String(formData.get("specCode") ?? "");
  if (!isSubjectId(subject)) return;
  const option = findBoard(subject, specCode);
  if (!option) return;
  const db = await getDb();
  await db
    .update(enrolments)
    .set({ board: option.board, specCode: option.specCode })
    .where(and(eq(enrolments.userId, user.id), eq(enrolments.subject, subject)));
  revalidatePath("/onboarding");
  revalidatePath("/home");
}

export async function saveTargets(formData: FormData) {
  const user = await requirePageUser();
  const db = await getDb();
  for (const subject of ["business", "psychology", "politics"] as const) {
    const grade = String(formData.get(subject) ?? "");
    if (!(GRADES as readonly string[]).includes(grade)) continue;
    await db
      .update(enrolments)
      .set({ targetGrade: grade })
      .where(and(eq(enrolments.userId, user.id), eq(enrolments.subject, subject)));
  }
  await db.update(users).set({ onboarded: true }).where(eq(users.id, user.id));
  revalidatePath("/home");
  redirect("/home");
}
