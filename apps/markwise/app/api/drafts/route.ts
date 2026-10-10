import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { safePath } from "@/lib/content";
import { saveDraft } from "@/lib/queries";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const form = await request.formData();
  const questionId = String(form.get("questionId") ?? "");
  const answer = String(form.get("answer") ?? "");
  const saved = await saveDraft(user.id, questionId, answer);
  const next = safePath(undefined, `/practice/${questionId}?saved=1`);
  if (!saved) return NextResponse.redirect(new URL(`/practice/${questionId}?error=1`, request.url), 303);
  return NextResponse.redirect(new URL(next, request.url), 303);
}
