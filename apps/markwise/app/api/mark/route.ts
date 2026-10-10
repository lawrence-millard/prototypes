import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { capMessage } from "@/lib/caps";
import { safePath } from "@/lib/content";
import { submitMark } from "@/lib/mark-service";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const body = await readBody(request);
  const questionId = body.questionId ?? "";
  const result = await submitMark(user, {
    questionId,
    answer: body.answer,
    choice: body.choice,
  });
  const json = wantsJson(request);

  if (!result.ok) {
    const message =
      result.error === "cap"
        ? capMessage("mark")
        : result.error === "empty"
          ? "Write an answer before it is marked."
          : result.error === "unavailable"
            ? "That question is not on the spec you have selected."
            : "That question could not be found.";
    if (json) return NextResponse.json({ error: result.error, message }, { status: result.error === "cap" ? 429 : 400 });
    const back = safePath(body.next, `/practice/${questionId}?error=${result.error === "cap" ? "cap" : "1"}`);
    return NextResponse.redirect(new URL(back, request.url), 303);
  }

  if (json) return NextResponse.json({ attemptId: result.attemptId, result: result.result });
  const next = safePath(body.next, `/practice/${questionId}/feedback`);
  return NextResponse.redirect(new URL(next, request.url), 303);
}

async function readBody(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
    );
  }
  const form = await request.formData();
  return Object.fromEntries(
    [...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function wantsJson(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return type.includes("application/json") || accept.includes("application/json");
}
