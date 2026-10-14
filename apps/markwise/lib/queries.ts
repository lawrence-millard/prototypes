import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { buildDailyPlan, practiceTarget, topicsForPlan } from "@/lib/plan";
import { predictGrade } from "@/lib/grades";
import {
  attempts,
  chats,
  drafts,
  enrolments,
  messages,
  mastery,
  questions,
  topics,
} from "@/lib/schema";
import { asSubject, toQuestion } from "@/lib/content";
import { POLITICS_MOCK, SUBJECT_ORDER, SUBJECTS, type BoardOption, BOARD_OPTIONS } from "@/lib/subjects";
import type { MarkResult, SubjectId } from "@/lib/types";

export async function homeData(userId: string) {
  const db = await getDb();
  const [enrolmentRows, topicRows, questionRows, masteryRows] = await Promise.all([
    db.select().from(enrolments).where(eq(enrolments.userId, userId)),
    db.select().from(topics),
    db.select().from(questions),
    db.select().from(mastery).where(eq(mastery.userId, userId)),
  ]);
  const specBySubject = Object.fromEntries(enrolmentRows.map((row) => [row.subject, row.specCode])) as Partial<
    Record<SubjectId, string>
  >;
  const planTopics = topicsForPlan(
    topicRows.map(toTopic),
    questionRows.map(toQuestion),
    masteryRows.map((row) => ({ topicId: row.topicId, pKnown: row.pKnown })),
    specBySubject,
  );
  return { plan: buildDailyPlan(planTopics), mock: POLITICS_MOCK };
}

export async function questionForUser(userId: string, questionId: string) {
  const db = await getDb();
  const questionRows = await db.select().from(questions).where(eq(questions.id, questionId));
  const question = questionRows[0];
  if (!question) return null;
  const topicRows = await db.select().from(topics).where(eq(topics.id, question.topicId));
  const topic = topicRows[0];
  if (!topic) return null;
  const subject = asSubject(topic.subject);
  const enrolmentRows = await db
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.userId, userId), eq(enrolments.subject, subject)));
  if (!enrolmentRows[0] || enrolmentRows[0].specCode !== question.specCode) return null;
  const draftRows = await db
    .select()
    .from(drafts)
    .where(and(eq(drafts.userId, userId), eq(drafts.questionId, questionId)));
  return { question: toQuestion(question), subject, draft: draftRows[0]?.answer ?? "" };
}

export async function feedbackForUser(userId: string, questionId: string) {
  const page = await questionForUser(userId, questionId);
  if (!page) return null;
  const db = await getDb();
  const attemptRows = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.questionId, questionId)))
    .orderBy(desc(attempts.createdAt));
  const attempt = attemptRows[0];
  if (!attempt) return { ...page, attempt: null };
  return {
    ...page,
    attempt: {
      id: attempt.id,
      answer: attempt.answer,
      flagged: attempt.flagged,
      feedback: attempt.feedback as MarkResult,
    },
  };
}

export async function progressForUser(userId: string) {
  const db = await getDb();
  const [enrolmentRows, topicRows, questionRows, masteryRows] = await Promise.all([
    db.select().from(enrolments).where(eq(enrolments.userId, userId)),
    db.select().from(topics),
    db.select().from(questions),
    db.select().from(mastery).where(eq(mastery.userId, userId)),
  ]);
  const specBySubject = Object.fromEntries(enrolmentRows.map((row) => [row.subject, row.specCode])) as Partial<
    Record<SubjectId, string>
  >;
  const planTopics = topicsForPlan(
    topicRows.map(toTopic),
    questionRows.map(toQuestion),
    masteryRows.map((row) => ({ topicId: row.topicId, pKnown: row.pKnown })),
    specBySubject,
  );
  const withEvidence = planTopics.filter((topic) => masteryRows.some((row) => row.topicId === topic.id));
  const weakest = [...withEvidence].sort((a, b) => a.pKnown - b.pKnown).slice(0, 6);
  const grades = SUBJECT_ORDER.map((subject) => {
    const values = withEvidence.filter((topic) => topic.subject === subject).map((topic) => topic.pKnown);
    const enrolment = enrolmentRows.find((row) => row.subject === subject);
    return {
      subject,
      label: SUBJECTS[subject].label,
      predicted: predictGrade(values),
      target: enrolment?.targetGrade ?? "A",
    };
  });
  const focus = weakest[0] ? practiceTarget(weakest[0]) : null;
  return { grades, weakest, focus };
}

export async function onboardingState(userId: string) {
  const db = await getDb();
  const rows = await db.select().from(enrolments).where(eq(enrolments.userId, userId));
  return rows.map((row) => {
    const subject = asSubject(row.subject);
    const options = BOARD_OPTIONS.filter((option) => option.subject === subject);
    const current = options.find((option) => option.specCode === row.specCode);
    return {
      subject,
      label: SUBJECTS[subject].label,
      board: row.board,
      specCode: row.specCode,
      level: "A Level",
      target: row.targetGrade,
      available: current?.available ?? false,
      line: `${row.board} A Level · ${row.specCode}`,
      options,
    };
  });
}

export async function quizForUser(userId: string, slug: string) {
  const db = await getDb();
  const rows = await db.select().from(questions).where(eq(questions.quizSlug, slug)).orderBy(asc(questions.quizOrder));
  if (rows.length === 0) return null;
  const first = rows[0];
  const topicRows = await db.select().from(topics).where(eq(topics.id, first.topicId));
  const topic = topicRows[0];
  if (!topic) return null;
  const subject = asSubject(topic.subject);
  const enrolmentRows = await db
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.userId, userId), eq(enrolments.subject, subject)));
  if (!enrolmentRows[0] || enrolmentRows[0].specCode !== first.specCode) return null;
  const attemptRows = await db.select().from(attempts).where(eq(attempts.userId, userId));
  const byQuestion = new Map(attemptRows.map((attempt) => [attempt.questionId, attempt]));
  const items = rows.map(toQuestion);
  const next = items.find((question) => !byQuestion.has(question.id)) ?? null;
  const answered = items.filter((question) => byQuestion.has(question.id));
  const score = answered.reduce((sum, question) => sum + (byQuestion.get(question.id)?.total ?? 0), 0);
  const latest = next
    ? null
    : [...answered]
        .map((question) => byQuestion.get(question.id)!)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return {
    slug,
    title: topic.planTitle,
    subject,
    breadcrumb: first.breadcrumb,
    total: items.length,
    answered: answered.length,
    score,
    next,
    done: !next,
    latestCorrect: latest ? latest.total > 0 : null,
  };
}

export async function tutorState(
  userId: string,
  filters: { attemptId?: string; subject?: string; topic?: string },
) {
  const db = await getDb();
  if (filters.attemptId) {
    const attemptRows = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.id, filters.attemptId), eq(attempts.userId, userId)));
    const attempt = attemptRows[0];
    if (attempt) {
      const questionRows = await db.select().from(questions).where(eq(questions.id, attempt.questionId));
      const question = questionRows[0];
      const topicRows = question ? await db.select().from(topics).where(eq(topics.id, question.topicId)) : [];
      const topic = topicRows[0];
      if (question && topic) {
        const subject = asSubject(topic.subject);
        const chat = await findOrCreateChat(userId, {
          subject,
          topicName: topic.name,
          specLabel: SUBJECTS[subject].specLabel,
          stem: question.stem,
        });
        return chatView(chat.id);
      }
    }
  }

  const existing = await db.select().from(chats).where(eq(chats.userId, userId)).orderBy(desc(chats.createdAt));
  if (existing[0]) return chatView(existing[0].id);
  const created = await findOrCreateChat(userId, {
    subject: "psychology",
    topicName: "Memory",
    specLabel: "AQA",
    stem: undefined,
  });
  return chatView(created.id);
}

async function chatView(chatId: string) {
  const db = await getDb();
  const chatRows = await db.select().from(chats).where(eq(chats.id, chatId));
  const chat = chatRows[0];
  const messageRows = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(asc(messages.createdAt));
  return {
    chatId,
    subject: asSubject(chat.subject),
    topicName: chat.topicName,
    specLabel: chat.specLabel,
    stem: chat.stem,
    messages: messageRows.map((message) => ({
      id: message.id,
      role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: message.content,
    })),
  };
}

async function findOrCreateChat(
  userId: string,
  input: { subject: SubjectId; topicName: string; specLabel: string; stem?: string },
) {
  const db = await getDb();
  const rows = await db.select().from(chats).where(and(eq(chats.userId, userId), eq(chats.subject, input.subject)));
  const match = rows.find((row) => row.topicName === input.topicName);
  if (match) return match;
  const id = crypto.randomUUID();
  await db.insert(chats).values({
    id,
    userId,
    subject: input.subject,
    topicName: input.topicName,
    specLabel: input.specLabel,
    stem: input.stem,
  });
  const created = await db.select().from(chats).where(eq(chats.id, id));
  return created[0];
}

export async function saveDraft(userId: string, questionId: string, answer: string) {
  const db = await getDb();
  const allowed = await questionForUser(userId, questionId);
  if (!allowed || allowed.question.type === "mcq") return false;
  await db
    .insert(drafts)
    .values({ userId, questionId, answer, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [drafts.userId, drafts.questionId],
      set: { answer, updatedAt: new Date() },
    });
  return true;
}

export async function flagAttempt(userId: string, attemptId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));
  if (!rows[0]) return false;
  await db.update(attempts).set({ flagged: true }).where(eq(attempts.id, attemptId));
  return true;
}

function toTopic(row: typeof topics.$inferSelect) {
  return {
    id: row.id,
    subject: asSubject(row.subject),
    specCode: row.specCode,
    specRef: row.specRef,
    name: row.name,
    planTitle: row.planTitle,
    theme: row.theme,
  };
}

export type OnboardingOption = BoardOption;
