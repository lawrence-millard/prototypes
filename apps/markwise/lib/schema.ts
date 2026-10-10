import { boolean, integer, jsonb, pgTable, primaryKey, real, text, timestamp } from "drizzle-orm/pg-core";
import type { AoWeight, LevelBand, MarkResult, McqChoice } from "@/lib/types";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastActiveOn: text("last_active_on"),
  examDate: text("exam_date"),
  onboarded: boolean("onboarded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enrolments = pgTable(
  "enrolments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    subject: text("subject").notNull(),
    board: text("board").notNull(),
    specCode: text("spec_code").notNull(),
    targetGrade: text("target_grade").notNull().default("A"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.subject] })],
);

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  specCode: text("spec_code").notNull(),
  specRef: text("spec_ref").notNull(),
  name: text("name").notNull(),
  planTitle: text("plan_title").notNull(),
  theme: text("theme").notNull(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => topics.id),
  specCode: text("spec_code").notNull(),
  type: text("type").notNull(),
  commandWord: text("command_word"),
  marks: integer("marks").notNull(),
  stem: text("stem").notNull(),
  breadcrumb: text("breadcrumb").notNull(),
  choices: jsonb("choices").$type<McqChoice[]>(),
  correctChoice: text("correct_choice"),
  shortPoints: jsonb("short_points").$type<string[]>(),
  pointLabels: jsonb("point_labels").$type<string[]>(),
  aoWeights: jsonb("ao_weights").$type<AoWeight>(),
  levels: jsonb("levels").$type<LevelBand[]>(),
  indicativeContent: jsonb("indicative_content").$type<string[]>(),
  exemplarKey: text("exemplar_key"),
  quizSlug: text("quiz_slug"),
  quizOrder: integer("quiz_order"),
});

export const exemplars = pgTable("exemplars", {
  id: text("id").primaryKey(),
  exemplarKey: text("exemplar_key").notNull(),
  answer: text("answer").notNull(),
  level: integer("level").notNull(),
  marks: integer("marks").notNull(),
  note: text("note").notNull(),
});

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id),
  answer: text("answer").notNull(),
  answerHash: text("answer_hash"),
  total: integer("total").notNull(),
  level: integer("level"),
  feedback: jsonb("feedback").$type<MarkResult>().notNull(),
  flagged: boolean("flagged").notNull().default(false),
  source: text("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mastery = pgTable(
  "mastery",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    pKnown: real("p_known").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.topicId] })],
);

export const drafts = pgTable(
  "drafts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id),
    answer: text("answer").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.questionId] })],
);

export const chats = pgTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  subject: text("subject").notNull(),
  topicName: text("topic_name").notNull(),
  specLabel: text("spec_label").notNull(),
  stem: text("stem"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiUsage = pgTable(
  "ai_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    day: text("day").notNull(),
    marks: integer("marks").notNull().default(0),
    tutorTurns: integer("tutor_turns").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.day] })],
);

export const markCache = pgTable(
  "mark_cache",
  {
    questionId: text("question_id").notNull(),
    answerHash: text("answer_hash").notNull(),
    result: jsonb("result").$type<MarkResult>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.answerHash] })],
);

export type UserRow = typeof users.$inferSelect;
export type QuestionRow = typeof questions.$inferSelect;
export type ExemplarRow = typeof exemplars.$inferSelect;
