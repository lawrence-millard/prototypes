import type { ExemplarRow, QuestionRow } from "@/lib/schema";
import type { ExemplarSeed, QuestionSeed, SubjectId } from "@/lib/types";
import { isSubjectId } from "@/lib/subjects";

export function toQuestion(row: QuestionRow): QuestionSeed {
  return {
    id: row.id,
    topicId: row.topicId,
    specCode: row.specCode,
    type: row.type as QuestionSeed["type"],
    commandWord: row.commandWord,
    marks: row.marks,
    stem: row.stem,
    breadcrumb: row.breadcrumb,
    choices: row.choices ?? undefined,
    correctChoice: row.correctChoice ?? undefined,
    shortPoints: row.shortPoints ?? undefined,
    pointLabels: row.pointLabels ?? undefined,
    aoWeights: row.aoWeights ?? undefined,
    levels: row.levels ?? undefined,
    indicativeContent: row.indicativeContent ?? undefined,
    exemplarKey: row.exemplarKey ?? undefined,
    quizSlug: row.quizSlug ?? undefined,
    quizOrder: row.quizOrder ?? undefined,
  };
}

export function toExemplar(row: ExemplarRow): ExemplarSeed {
  return {
    id: row.id,
    exemplarKey: row.exemplarKey,
    answer: row.answer,
    level: row.level,
    marks: row.marks,
    note: row.note,
  };
}

export function asSubject(value: string): SubjectId {
  if (!isSubjectId(value)) throw new Error(`Unknown subject ${value}`);
  return value;
}

export function safePath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
