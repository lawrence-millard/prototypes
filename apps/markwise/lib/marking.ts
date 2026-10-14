import { createHash } from "node:crypto";
import { aoLabel } from "@/lib/subjects";
import { levelForTotal } from "@/lib/levels";
import type { MarkAo, MarkResult, QuestionSeed, RawMark, SubjectId } from "@/lib/types";

export function finalizeMark(raw: RawMark, question: QuestionSeed, subject: SubjectId, answer: string, source: MarkResult["source"]): MarkResult {
  const weights = question.aoWeights ?? {};
  const codes = Object.keys(weights);
  const byCode = new Map(raw.ao.map((row) => [row.code.toUpperCase(), row]));
  const ao: MarkAo[] = codes.map((code) => {
    const max = weights[code as keyof typeof weights] ?? 0;
    const row = byCode.get(code);
    const awarded = clamp(Math.round(row?.awarded ?? 0), 0, max);
    return {
      code,
      name: aoLabel(subject, code),
      awarded,
      max,
      comment: tidy(row?.comment) || (awarded === 0 ? "Not shown in this answer." : "Credit given."),
      evidence: quoteFromAnswer(row?.evidence, answer),
    };
  });

  let total = ao.reduce((sum, row) => sum + row.awarded, 0);
  if (total > question.marks) {
    let spare = total - question.marks;
    for (let index = ao.length - 1; index >= 0 && spare > 0; index -= 1) {
      const cut = Math.min(ao[index].awarded, spare);
      ao[index].awarded -= cut;
      spare -= cut;
    }
    total = ao.reduce((sum, row) => sum + row.awarded, 0);
  }

  const levels = question.levels ?? [];
  const maxLevel = levels.reduce((max, band) => Math.max(max, band.level), 1);
  const level = levels.length ? levelForTotal(levels, total) : clamp(Math.round(raw.level), 1, maxLevel);

  return {
    mode: "levels",
    level,
    maxLevel,
    total,
    marks: question.marks,
    summary: tidy(raw.summary) || "An estimate from the levels descriptors.",
    nextLevelTip: tidy(raw.nextLevelTip) || "Add a second developed chain and end with a weighed judgement.",
    ao,
    source,
    cached: false,
  };
}

export function answerHash(answer: string) {
  const normalised = answer.trim().replace(/\s+/g, " ").toLowerCase();
  return createHash("sha256").update(normalised).digest("hex");
}

function quoteFromAnswer(evidence: string | undefined, answer: string) {
  if (!evidence) return undefined;
  const quoted = evidence.trim();
  if (!quoted) return undefined;
  const norm = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
  if (!norm(answer).includes(norm(quoted))) return undefined;
  return quoted.length > 180 ? `${quoted.slice(0, 177)}...` : quoted;
}

function tidy(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
