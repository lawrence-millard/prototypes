import type { SubjectId } from "@/lib/types";

export const SUBJECT_ORDER: SubjectId[] = ["business", "psychology", "politics"];

export const SUBJECTS: Record<
  SubjectId,
  { label: string; scheme: string; specLabel: string }
> = {
  business: {
    label: "Business",
    scheme: "Edexcel-style",
    specLabel: "Pearson Edexcel",
  },
  psychology: {
    label: "Psychology",
    scheme: "AQA-style",
    specLabel: "AQA",
  },
  politics: {
    label: "Politics",
    scheme: "Edexcel-style",
    specLabel: "Pearson Edexcel",
  },
};

export type BoardOption = {
  subject: SubjectId;
  board: string;
  specCode: string;
  level: string;
  available: boolean;
};

export const BOARD_OPTIONS: BoardOption[] = [
  { subject: "business", board: "Pearson Edexcel", specCode: "9BS0", level: "A Level", available: true },
  { subject: "business", board: "AQA", specCode: "7132", level: "A Level", available: false },
  { subject: "business", board: "OCR", specCode: "H431", level: "A Level", available: false },
  { subject: "psychology", board: "AQA", specCode: "7182", level: "A Level", available: true },
  { subject: "psychology", board: "Pearson Edexcel", specCode: "9PS0", level: "A Level", available: false },
  { subject: "psychology", board: "OCR", specCode: "H567", level: "A Level", available: false },
  { subject: "politics", board: "Pearson Edexcel", specCode: "9PL0", level: "A Level", available: true },
  { subject: "politics", board: "AQA", specCode: "7152", level: "A Level", available: false },
];

export const DEFAULT_ENROLMENTS: Record<SubjectId, { board: string; specCode: string; target: string }> = {
  business: { board: "Pearson Edexcel", specCode: "9BS0", target: "A" },
  psychology: { board: "AQA", specCode: "7182", target: "A*" },
  politics: { board: "Pearson Edexcel", specCode: "9PL0", target: "B" },
};

export const GRADES = ["A*", "A", "B", "C", "D", "E"] as const;

export const DEMO_USER_ID = "demo_aisha";
export const DEMO_EXAM_DATE = "2027-05-14";
export const DEMO_NAME = "Aisha";

export const POLITICS_MOCK = {
  id: "politics-paper-1",
  subject: "politics" as const,
  title: "Mock: Politics Paper 1, UK Politics",
  minutes: 120,
  marks: 84,
  anchorDate: "2026-10-17",
  questionIds: ["pol-parliament-source", "pol-pm-presidential", "pol-ideas-state"],
};

export function isSubjectId(value: string): value is SubjectId {
  return value === "business" || value === "psychology" || value === "politics";
}

export function boardLine(board: string, level: string, specCode: string) {
  return `${board} ${level} · ${specCode}`;
}

export function findBoard(subject: string, specCode: string) {
  return BOARD_OPTIONS.find((option) => option.subject === subject && option.specCode === specCode);
}

export function aoLabel(subject: SubjectId, code: string) {
  if (subject === "politics") {
    return ({ AO1: "Knowledge", AO2: "Analysis", AO3: "Evaluation" } as Record<string, string>)[code] ?? code;
  }
  if (subject === "psychology") {
    return ({ AO1: "Knowledge", AO2: "Application", AO3: "Evaluation" } as Record<string, string>)[code] ?? code;
  }
  return (
    ({ AO1: "Knowledge", AO2: "Application", AO3: "Analysis", AO4: "Evaluation" } as Record<string, string>)[code] ??
    code
  );
}
