import { z } from "zod";

export const questionSchema = z.string().trim().min(1, "Add a question.").max(140, "Question is too long.");
export const optionsSchema = z.array(z.string().trim().min(1).max(80)).min(2, "Add two options.").max(6, "Use up to 6 options.");

export function cleanOptions(values: string[]): { ok: true; options: string[] } | { ok: false; error: string } {
  const parsed = optionsSchema.safeParse(values.map((value) => value.trim()).filter(Boolean));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Add two options." };
  return { ok: true, options: parsed.data };
}
