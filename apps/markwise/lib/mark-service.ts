import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { bktUpdate, passedAttempt, xpForAttempt } from "@/lib/bkt";
import { canSpend } from "@/lib/caps";
import { asSubject, toExemplar, toQuestion } from "@/lib/content";
import { getDb } from "@/lib/db";
import { londonDate, nextStreak } from "@/lib/dates";
import { answerHash } from "@/lib/marking";
import { markAnswer } from "@/lib/ai";
import { mockMark } from "@/lib/mock-ai";
import { redactForModel } from "@/lib/redact";
import {
  aiUsage,
  attempts,
  drafts,
  enrolments,
  exemplars,
  markCache,
  mastery,
  questions,
  topics,
  users,
  type UserRow,
} from "@/lib/schema";
import { SUBJECTS } from "@/lib/subjects";
import type { MarkResult } from "@/lib/types";

export async function submitMark(
  user: UserRow,
  input: { questionId: string; answer?: string; choice?: string },
): Promise<{ ok: true; attemptId: string; result: MarkResult } | { ok: false; error: "missing" | "empty" | "cap" | "unavailable" }> {
  const db = await getDb();
  const questionRows = await db.select().from(questions).where(eq(questions.id, input.questionId));
  const questionRow = questionRows[0];
  if (!questionRow) return { ok: false, error: "missing" };
  const topicRows = await db.select().from(topics).where(eq(topics.id, questionRow.topicId));
  const topic = topicRows[0];
  if (!topic) return { ok: false, error: "missing" };
  const subject = asSubject(topic.subject);
  const enrolmentRows = await db
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.userId, user.id), eq(enrolments.subject, subject)));
  if (!enrolmentRows[0] || enrolmentRows[0].specCode !== questionRow.specCode) {
    return { ok: false, error: "unavailable" };
  }

  const original = (questionRow.type === "mcq" ? input.choice : input.answer)?.trim() ?? "";
  if (!original) return { ok: false, error: "empty" };
  const question = toQuestion(questionRow);
  const redacted = question.type === "mcq" ? original : redactForModel(original, user.displayName);

  let result: MarkResult;
  if (question.type === "extended") {
    const hash = answerHash(redacted);
    const cached = await db
      .select()
      .from(markCache)
      .where(and(eq(markCache.questionId, question.id), eq(markCache.answerHash, hash)));
    if (cached[0]) {
      result = { ...cached[0].result, cached: true };
    } else {
      const usage = await usageFor(user.id);
      if (!canSpend(usage, "mark")) return { ok: false, error: "cap" };
      const exemplarRows = question.exemplarKey
        ? await db.select().from(exemplars).where(eq(exemplars.exemplarKey, question.exemplarKey))
        : [];
      result = await markAnswer({
        subject,
        subjectLabel: SUBJECTS[subject].label,
        specCode: question.specCode,
        question,
        exemplars: exemplarRows.map(toExemplar),
        answer: redacted,
      });
      await db.insert(markCache).values({ questionId: question.id, answerHash: hash, result }).onConflictDoNothing();
      await bumpUsage(user.id, "marks");
    }
  } else {
    result = mockMark(question, subject, redacted);
  }

  const attemptId = crypto.randomUUID();
  await db.insert(attempts).values({
    id: attemptId,
    userId: user.id,
    questionId: question.id,
    answer: original,
    answerHash: answerHash(redacted),
    total: result.total,
    level: result.level,
    feedback: result,
    source: result.source,
    flagged: false,
  });

  if (question.type !== "mcq") {
    await db
      .insert(drafts)
      .values({ userId: user.id, questionId: question.id, answer: original, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [drafts.userId, drafts.questionId],
        set: { answer: original, updatedAt: new Date() },
      });
  }

  const priorRows = await db
    .select()
    .from(mastery)
    .where(and(eq(mastery.userId, user.id), eq(mastery.topicId, topic.id)));
  const nextKnown = bktUpdate(priorRows[0]?.pKnown ?? 0.3, passedAttempt(result.total, result.marks));
  await db
    .insert(mastery)
    .values({ userId: user.id, topicId: topic.id, pKnown: nextKnown })
    .onConflictDoUpdate({
      target: [mastery.userId, mastery.topicId],
      set: { pKnown: nextKnown },
    });

  const today = londonDate(new Date());
  await db
    .update(users)
    .set({
      xp: user.xp + xpForAttempt(result.total, result.marks),
      streak: nextStreak(user.streak, user.lastActiveOn, today),
      lastActiveOn: today,
    })
    .where(eq(users.id, user.id));

  return { ok: true, attemptId, result };
}

export async function usageFor(userId: string) {
  const db = await getDb();
  const day = londonDate(new Date());
  const rows = await db
    .select()
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
  return { marks: rows[0]?.marks ?? 0, tutorTurns: rows[0]?.tutorTurns ?? 0 };
}

export async function bumpUsage(userId: string, kind: "marks" | "tutorTurns") {
  const db = await getDb();
  const day = londonDate(new Date());
  await db
    .insert(aiUsage)
    .values({
      userId,
      day,
      marks: kind === "marks" ? 1 : 0,
      tutorTurns: kind === "tutorTurns" ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set:
        kind === "marks"
          ? { marks: sql`${aiUsage.marks} + 1` }
          : { tutorTurns: sql`${aiUsage.tutorTurns} + 1` },
    });
}
