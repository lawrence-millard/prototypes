import type { ExemplarSeed, QuestionSeed } from "@/lib/types";

export function buildMarkPrompt(input: {
  subjectLabel: string;
  specCode: string;
  commandWord: string;
  question: QuestionSeed;
  exemplars: ExemplarSeed[];
  answer: string;
}) {
  const weights = Object.entries(input.question.aoWeights ?? {})
    .map(([code, max]) => `${code} maximum ${max}`)
    .join(", ");
  const levels = (input.question.levels ?? [])
    .map((band) => `Level ${band.level} (${band.min}-${band.max}): ${band.descriptor}`)
    .join("\n");
  const indicative = (input.question.indicativeContent ?? []).map((point) => `- ${point}`).join("\n");
  const anchors = input.exemplars
    .map((exemplar) => `Anchor level ${exemplar.level}, ${exemplar.marks} marks (${exemplar.note}):\n${exemplar.answer}`)
    .join("\n\n");

  return [
    "You are estimating an A Level mark. You do not know who the student is. Do not ask for or use a name, school, or contact details.",
    "Return JSON only.",
    "Choose the best-fit level from the descriptors, then place the mark inside that band.",
    "Award each assessment objective up to its maximum. The total must equal the sum of the AO marks.",
    "Evidence must be copied from the student answer. If you cannot find a quote, use an empty string.",
    "summary is one sentence the student can read. nextLevelTip is the single most useful change to reach the next level, with a concrete example from this question. Do not rewrite the essay.",
    "",
    `Subject: ${input.subjectLabel} ${input.specCode}`,
    `Command word: ${input.commandWord}`,
    `Marks available: ${input.question.marks}`,
    `Assessment objectives: ${weights}`,
    "",
    "Question:",
    input.question.stem,
    "",
    "Level descriptors:",
    levels,
    "",
    "Indicative content (not a checklist to tick off mechanically):",
    indicative,
    "",
    anchors ? `Hand-marked anchors for this question type:\n${anchors}` : "",
    "",
    "Student answer:",
    input.answer,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildTutorPrompt(input: {
  subjectLabel: string;
  specLabel: string;
  topic: string;
  stem?: string;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  const history = input.messages
    .map((message) => `${message.role === "user" ? "Student" : "Tutor"}: ${message.content}`)
    .join("\n\n");
  return [
    "You are Markwise, a Socratic A Level tutor.",
    `Stay inside ${input.subjectLabel} (${input.specLabel}), topic: ${input.topic}.`,
    "Never write a full essay, a model paragraph, or a complete answer the student could hand in.",
    "Give one hint or ask one focused question. Keep the reply under 80 words.",
    "If they ask you to write the essay, refuse in one sentence and give a hint instead.",
    "Do not use or request their name, school, email, or phone number.",
    input.stem ? `Question they are working on:\n${input.stem}` : "",
    "",
    "Conversation:",
    history,
  ]
    .filter((line) => line !== "")
    .join("\n");
}
