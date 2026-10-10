import "server-only";

import { z } from "zod";
import { mockMark, mockTutorReply } from "@/lib/mock-ai";
import { finalizeMark } from "@/lib/marking";
import { buildMarkPrompt, buildTutorPrompt } from "@/lib/prompts";
import type { ExemplarSeed, MarkResult, QuestionSeed, SubjectId } from "@/lib/types";

const MARK_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    level: { type: "INTEGER" },
    summary: { type: "STRING" },
    nextLevelTip: { type: "STRING" },
    ao: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          code: { type: "STRING" },
          awarded: { type: "INTEGER" },
          comment: { type: "STRING" },
          evidence: { type: "STRING" },
        },
        required: ["code", "awarded", "comment"],
      },
    },
  },
  required: ["level", "summary", "nextLevelTip", "ao"],
};

export function liveAiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
}

export async function markAnswer(input: {
  subject: SubjectId;
  subjectLabel: string;
  specCode: string;
  question: QuestionSeed;
  exemplars: ExemplarSeed[];
  answer: string;
}): Promise<MarkResult> {
  if (input.question.type !== "extended") {
    return mockMark(input.question, input.subject, input.answer);
  }

  const prompt = buildMarkPrompt({
    subjectLabel: input.subjectLabel,
    specCode: input.specCode,
    commandWord: input.question.commandWord ?? "question",
    question: input.question,
    exemplars: input.exemplars,
    answer: input.answer,
  });

  const generated = await generateText(prompt, true);
  if (!generated) return mockMark(input.question, input.subject, input.answer);

  try {
    const raw = parseMarkJson(generated.text);
    return finalizeMark(raw, input.question, input.subject, input.answer, generated.source);
  } catch (error) {
    console.error("Mark JSON failed validation", error);
    return mockMark(input.question, input.subject, input.answer);
  }
}

export async function tutorReply(input: {
  subject: SubjectId;
  subjectLabel: string;
  specLabel: string;
  topic: string;
  stem?: string;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  const latest = [...input.messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const prompt = buildTutorPrompt({
    subjectLabel: input.subjectLabel,
    specLabel: input.specLabel,
    topic: input.topic,
    stem: input.stem,
    messages: input.messages,
  });
  const generated = await generateText(prompt, false);
  if (!generated) {
    return mockTutorReply({ subject: input.subject, topic: input.topic, message: latest });
  }
  const text = generated.text.trim();
  if (!text) return mockTutorReply({ subject: input.subject, topic: input.topic, message: latest });
  return text.slice(0, 1200);
}

async function generateText(prompt: string, json: boolean): Promise<{ text: string; source: "gemini" | "groq" } | null> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return { text: await gemini(prompt, json), source: "gemini" };
    } catch (error) {
      console.error("Gemini request failed", statusOf(error));
    }
  }
  if (process.env.GROQ_API_KEY) {
    try {
      return { text: await groq(prompt, json), source: "groq" };
    } catch (error) {
      console.error("Groq request failed", statusOf(error));
    }
  }
  return null;
}

async function gemini(prompt: string, json: boolean) {
  const models = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL]
    : ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash-lite"];
  let lastError: Error | null = null;
  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: json
            ? { responseMimeType: "application/json", responseSchema: MARK_RESPONSE_SCHEMA, temperature: 0.2 }
            : { temperature: 0.4, maxOutputTokens: 400 },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );
    if (response.status === 404 && !process.env.GEMINI_MODEL) {
      lastError = httpError("Gemini", response.status);
      continue;
    }
    if (!response.ok) throw httpError("Gemini", response.status);
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text) throw new Error("Empty Gemini response");
    return text;
  }
  throw lastError ?? new Error("Gemini model not found");
}

async function groq(prompt: string, json: boolean) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: json
            ? "You are an A Level examiner. Return only JSON."
            : "You are a Socratic A Level tutor. Never write a full essay.",
        },
        { role: "user", content: prompt },
      ],
      temperature: json ? 0.2 : 0.4,
      max_tokens: json ? 900 : 300,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw httpError("Groq", response.status);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty Groq response");
  return text;
}

const RawMarkSchema = z.object({
  level: z.coerce.number(),
  summary: z.string().optional().default(""),
  nextLevelTip: z.string().optional().default(""),
  ao: z.array(
    z.object({
      code: z.string(),
      awarded: z.coerce.number(),
      comment: z.string().optional().default(""),
      evidence: z.string().optional(),
    }),
  ),
});

function parseMarkJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
  return RawMarkSchema.parse(parsed);
}

function httpError(source: string, status: number) {
  const error = new Error(`${source} ${status}`) as Error & { status: number };
  error.status = status;
  return error;
}

function statusOf(error: unknown) {
  return error instanceof Error ? error.message : "unknown";
}
