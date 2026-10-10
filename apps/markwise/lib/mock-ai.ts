import { aoLabel } from "@/lib/subjects";
import { levelForTotal } from "@/lib/levels";
import { wantsFullEssay } from "@/lib/redact";
import type { MarkAo, MarkResult, QuestionSeed, SubjectId } from "@/lib/types";

export const PED_SAMPLE_ANSWER =
  "The fee rises by 8%. If demand is price inelastic, members stay and revenue rises. Many members value convenience, so they may not switch. However, the new budget rival offers a close substitute, which makes demand more elastic. If more than 8% of members leave, revenue falls...";

export function peakFitSampleMark(): MarkResult {
  return {
    mode: "levels",
    level: 3,
    maxLevel: 4,
    total: 8,
    marks: 12,
    summary: "Good analysis of substitutes. Judgement needs a clear “it depends on”.",
    nextLevelTip:
      "Weigh up both sides and decide: e.g. revenue likely falls short term because the rival is a close substitute, unless PeakFit can show the new kit adds value.",
    ao: [
      {
        code: "AO1",
        name: "Knowledge",
        awarded: 2,
        max: 2,
        comment: "Defined PED correctly",
        evidence: "If demand is price inelastic, members stay and revenue rises.",
      },
      {
        code: "AO2",
        name: "Application",
        awarded: 2,
        max: 2,
        comment: "Used the £25 → £27 rise and the rival",
        evidence: "The fee rises by 8%.",
      },
      {
        code: "AO3",
        name: "Analysis",
        awarded: 3,
        max: 4,
        comment: "One developed chain; second is brief",
        evidence: "the new budget rival offers a close substitute, which makes demand more elastic.",
      },
      {
        code: "AO4",
        name: "Evaluation",
        awarded: 1,
        max: 4,
        comment: "No final weighted judgement",
      },
    ],
    source: "mock",
    cached: false,
  };
}

export function mockMark(question: QuestionSeed, subject: SubjectId, answer: string): MarkResult {
  if (question.type === "mcq") return markChoice(question, answer);
  if (question.type === "short") return markPoints(question, answer);
  if (question.id === "bus-ped-assess" && isPeakFitSample(answer)) return peakFitSampleMark();
  return markExtended(question, subject, answer);
}

export function mockTutorReply(input: {
  subject: SubjectId;
  topic: string;
  message: string;
}) {
  if (wantsFullEssay(input.message)) {
    return "I won't write that for you. Name one piece of evidence, then say whether it is a strength or a limitation.";
  }
  if (input.subject === "psychology") {
    return `Stay with the evidence on ${input.topic}. Which study or case supports your point, and what problem does that evidence create?`;
  }
  if (input.subject === "business") {
    return "Use the figures in the case. What happens if quantity falls by more than the price change, and what would make you decide the other way?";
  }
  return `Give one precise example for ${input.topic}, then say the strongest point on the other side.`;
}

function isPeakFitSample(answer: string) {
  const text = answer.toLowerCase();
  return (
    text.includes("fee rises by 8%") &&
    text.includes("budget rival") &&
    text.includes("close substitute") &&
    !text.includes("it depends")
  );
}

function markChoice(question: QuestionSeed, choice: string): MarkResult {
  const correct = question.correctChoice === choice;
  const chosen = question.choices?.find((item) => item.id === choice)?.text;
  const right = question.choices?.find((item) => item.id === question.correctChoice)?.text;
  return {
    mode: "mcq",
    level: correct ? 1 : 0,
    maxLevel: 1,
    total: correct ? question.marks : 0,
    marks: question.marks,
    summary: correct ? "That's the best option." : `The better option is: ${right ?? "see the mark scheme"}.`,
    nextLevelTip: correct ? "Try the next question while this distinction is fresh." : "Read the stem again and eliminate the option that describes a different institution.",
    ao: [
      {
        code: "Answer",
        name: correct ? "Correct" : "Incorrect",
        awarded: correct ? 1 : 0,
        max: 1,
        comment: chosen ? `You chose: ${chosen}` : "No option selected.",
      },
    ],
    source: "rules",
    cached: false,
  };
}

function markPoints(question: QuestionSeed, answer: string): MarkResult {
  const text = answer.toLowerCase();
  const points = question.shortPoints ?? [];
  const labels = question.pointLabels ?? points;
  const hits = points.map((point) => point.split("|").some((keyword) => text.includes(keyword.trim().toLowerCase())));
  const awarded = Math.min(question.marks, hits.filter(Boolean).length);
  const missed = labels.filter((_, index) => !hits[index]);
  return {
    mode: "points",
    level: 0,
    maxLevel: 0,
    total: awarded,
    marks: question.marks,
    summary: `You picked up ${awarded} of ${question.marks} points.`,
    nextLevelTip: missed[0] ? `Add this idea: ${missed[0]}.` : "That covers the points for this question.",
    ao: labels.map((label, index) => ({
      code: String(index + 1),
      name: "Point",
      awarded: hits[index] ? 1 : 0,
      max: 1,
      comment: hits[index] ? label : `Missing: ${label}`,
    })),
    source: "rules",
    cached: false,
  };
}

function markExtended(question: QuestionSeed, subject: SubjectId, answer: string): MarkResult {
  const text = answer.toLowerCase();
  const bullets = question.indicativeContent ?? [];
  const hits = bullets.filter((bullet) => keywords(bullet).some((word) => text.includes(word)));
  const coverage = bullets.length ? hits.length / bullets.length : 0;
  const figures = (question.stem.match(/£?\d+(?:\.\d+)?%?/g) ?? []).filter((token) => token.length > 1);
  const applied = figures.length === 0 || figures.some((figure) => text.includes(figure.replace("£", "").toLowerCase()) || text.includes(figure.toLowerCase()));
  const chains = (text.match(/\b(because|so|therefore|which means|if)\b/g) ?? []).length;
  const bothSides = /\b(however|whereas|although|on the other hand)\b/.test(text);
  const judgement = /\b(overall|on balance|it depends|weigh|judgement|judgment)\b/.test(text);
  const weights = question.aoWeights ?? {};
  const ao: MarkAo[] = Object.entries(weights).map(([code, max]) => {
    const ratio =
      code === "AO1"
        ? clamp(coverage * 1.15, 0, 1)
        : code === "AO2"
          ? applied
            ? clamp(0.45 + coverage * 0.55, 0, 1)
            : coverage * 0.35
          : code === "AO4" || (code === "AO3" && subject === "politics")
            ? judgement
              ? bothSides
                ? 0.85
                : 0.45
              : 0.15
            : chains >= 2
              ? clamp(0.55 + coverage * 0.4, 0, 1)
              : coverage * 0.55;
    return {
      code,
      name: aoLabel(subject, code),
      awarded: Math.round(ratio * max),
      max,
      comment: ratio > 0.7 ? "Developed in the answer." : ratio > 0.35 ? "Present, but not fully developed." : "Thin in this answer.",
      evidence: answer.split(/(?<=[.?!])\s/)[0]?.slice(0, 160),
    };
  });
  const total = Math.min(
    question.marks,
    ao.reduce((sum, row) => sum + row.awarded, 0),
  );
  const levels = question.levels ?? [];
  const level = levels.length ? levelForTotal(levels, total) : 1;
  const maxLevel = levels.reduce((max, band) => Math.max(max, band.level), 1);
  return {
    mode: "levels",
    level,
    maxLevel,
    total,
    marks: question.marks,
    summary:
      coverage >= 0.5
        ? "The answer uses relevant ideas. Push the judgement so it decides between the two sides."
        : "The answer is still thin against the indicative content. Build one chain in context before you evaluate.",
    nextLevelTip:
      level >= maxLevel
        ? "This is already in the top band. Check each AO still has a precise example."
        : "Add a second developed chain in the context of the question, then end with a weighed 'it depends on' judgement.",
    ao,
    source: "mock",
    cached: false,
  };
}

function keywords(bullet: string) {
  return bullet
    .toLowerCase()
    .replace(/[^a-z0-9%£\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 4);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
