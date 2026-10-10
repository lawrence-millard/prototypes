import { and, asc, eq } from "drizzle-orm";
import { requireApiUser } from "@/lib/auth";
import { tutorReply } from "@/lib/ai";
import { canSpend, capMessage } from "@/lib/caps";
import { getDb } from "@/lib/db";
import { bumpUsage, usageFor } from "@/lib/mark-service";
import { crisisReply, redactForModel } from "@/lib/redact";
import { chats, messages } from "@/lib/schema";
import { SUBJECTS, isSubjectId } from "@/lib/subjects";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "unauthorised" }, { status: 401 });
  const body = (await request.json()) as { chatId?: string; content?: string };
  const content = (body.content ?? "").trim();
  if (!content || content.length > 2000) {
    return Response.json({ error: "empty", message: "Write a shorter question." }, { status: 400 });
  }

  const db = await getDb();
  const chatRows = body.chatId
    ? await db.select().from(chats).where(and(eq(chats.id, body.chatId), eq(chats.userId, user.id)))
    : [];
  const chat = chatRows[0];
  if (!chat || !isSubjectId(chat.subject)) {
    return Response.json({ error: "missing", message: "Start from a subject chat." }, { status: 404 });
  }

  const prior = await db.select().from(messages).where(eq(messages.chatId, chat.id)).orderBy(asc(messages.createdAt));
  const redacted = redactForModel(content, user.displayName);
  const crisis = crisisReply(redacted);
  let reply = crisis;
  if (!reply) {
    const usage = await usageFor(user.id);
    if (!canSpend(usage, "tutor")) {
      return Response.json({ error: "cap", message: capMessage("tutor") }, { status: 429 });
    }
    const history = [
      ...prior.slice(-8).map((message) => ({
        role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: redactForModel(message.content, user.displayName),
      })),
      { role: "user" as const, content: redacted },
    ];
    reply = await tutorReply({
      subject: chat.subject,
      subjectLabel: SUBJECTS[chat.subject].label,
      specLabel: chat.specLabel,
      topic: chat.topicName,
      stem: chat.stem ? redactForModel(chat.stem, user.displayName) : undefined,
      messages: history,
    });
    await bumpUsage(user.id, "tutorTurns");
  }

  const now = Date.now();
  await db.insert(messages).values([
    { id: crypto.randomUUID(), chatId: chat.id, role: "user", content, createdAt: new Date(now) },
    { id: crypto.randomUUID(), chatId: chat.id, role: "assistant", content: reply, createdAt: new Date(now + 1) },
  ]);

  const encoder = new TextEncoder();
  const parts = reply.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      for (const part of parts) {
        controller.enqueue(encoder.encode(part));
        if (part.trim()) await new Promise((resolve) => setTimeout(resolve, 12));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Chat-Id": chat.id,
      "Cache-Control": "no-store",
    },
  });
}
