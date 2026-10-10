import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { answerHash } from "@/lib/marking";
import {
  attempts,
  chats,
  drafts,
  enrolments,
  exemplars,
  mastery,
  messages,
  questions,
  topics,
  users,
} from "@/lib/schema";
import { DEFAULT_ENROLMENTS, SUBJECT_ORDER } from "@/lib/subjects";
import { businessQuestions, businessTopics } from "@/lib/seed/business";
import { demoAttempt, demoChat, demoDraft, demoMastery, demoProfile } from "@/lib/seed/demo";
import { exemplars as exemplarSeeds } from "@/lib/seed/exemplars";
import { politicsQuestions, politicsTopics } from "@/lib/seed/politics";
import { psychologyQuestions, psychologyTopics } from "@/lib/seed/psychology";

const topicSeeds = [...businessTopics, ...psychologyTopics, ...politicsTopics];
const questionSeeds = [...businessQuestions, ...psychologyQuestions, ...politicsQuestions];

export async function seedCatalog(db: Database) {
  await db.insert(topics).values(topicSeeds).onConflictDoNothing();
  await db
    .insert(questions)
    .values(
      questionSeeds.map((question) => ({
        id: question.id,
        topicId: question.topicId,
        specCode: question.specCode,
        type: question.type,
        commandWord: question.commandWord,
        marks: question.marks,
        stem: question.stem,
        breadcrumb: question.breadcrumb,
        choices: question.choices,
        correctChoice: question.correctChoice,
        shortPoints: question.shortPoints,
        pointLabels: question.pointLabels,
        aoWeights: question.aoWeights,
        levels: question.levels,
        indicativeContent: question.indicativeContent,
        exemplarKey: question.exemplarKey,
        quizSlug: question.quizSlug,
        quizOrder: question.quizOrder,
      })),
    )
    .onConflictDoNothing();
  await db.insert(exemplars).values(exemplarSeeds).onConflictDoNothing();
}

export async function seedDemo(db: Database) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  await db.insert(users).values({
    id: demoProfile.id,
    displayName: demoProfile.displayName,
    xp: demoProfile.xp,
    streak: demoProfile.streak,
    lastActiveOn: today,
    examDate: demoProfile.examDate,
    onboarded: demoProfile.onboarded,
  });

  await db.insert(enrolments).values(
    SUBJECT_ORDER.map((subject) => ({
      userId: demoProfile.id,
      subject,
      board: DEFAULT_ENROLMENTS[subject].board,
      specCode: DEFAULT_ENROLMENTS[subject].specCode,
      targetGrade: DEFAULT_ENROLMENTS[subject].target,
    })),
  );

  await db.insert(mastery).values(
    demoMastery.map((row) => ({
      userId: demoProfile.id,
      topicId: row.topicId,
      pKnown: row.pKnown,
    })),
  );

  await db.insert(drafts).values({
    userId: demoProfile.id,
    questionId: demoDraft.questionId,
    answer: demoDraft.answer,
  });

  await db.insert(attempts).values({
    id: demoAttempt.id,
    userId: demoProfile.id,
    questionId: demoAttempt.questionId,
    answer: demoAttempt.answer,
    answerHash: answerHash(demoAttempt.answer),
    total: demoAttempt.feedback.total,
    level: demoAttempt.feedback.level,
    feedback: demoAttempt.feedback,
    source: demoAttempt.feedback.source,
    flagged: false,
    createdAt: new Date("2026-10-09T18:00:00Z"),
  });

  await db.insert(chats).values({
    id: demoChat.id,
    userId: demoProfile.id,
    subject: demoChat.subject,
    topicName: demoChat.topicName,
    specLabel: demoChat.specLabel,
    stem: "Evaluate the multi-store model of memory.",
    createdAt: new Date("2026-10-10T08:00:00Z"),
  });

  const start = new Date("2026-10-10T08:00:00Z").getTime();
  await db.insert(messages).values(
    demoChat.messages.map((message, index) => ({
      id: `demo-tutor-msg-${index + 1}`,
      chatId: demoChat.id,
      role: message.role,
      content: message.content,
      createdAt: new Date(start + index * 60_000),
    })),
  );

  await db.select({ id: users.id }).from(users).where(eq(users.id, demoProfile.id));
}
