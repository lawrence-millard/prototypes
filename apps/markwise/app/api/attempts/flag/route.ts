import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { flagAttempt } from "@/lib/queries";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const body = (await request.json()) as { attemptId?: string };
  if (!body.attemptId) return NextResponse.json({ error: "missing" }, { status: 400 });
  const flagged = await flagAttempt(user.id, body.attemptId);
  if (!flagged) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
