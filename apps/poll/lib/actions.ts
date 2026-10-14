"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writer } from "@/lib/gate";
import { actionError, type ActionState } from "@/lib/errors";
import { castVote, deletePoll, insertPoll, setClosed, updateQuestion } from "@/lib/queries";
import { cleanOptions, questionSchema } from "@/lib/schemas";

export async function createPoll(_prev: ActionState, form: FormData): Promise<ActionState> {
  const question = questionSchema.safeParse(form.get("question"));
  const options = cleanOptions(form.getAll("option").map(String));
  if (!question.success) return { error: question.error.issues[0]?.message ?? "Add a question." };
  if (!options.ok) return { error: options.error };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const saved = await insertPoll(auth.userId, question.data, options.options);
    if (!saved) return { error: "Limit reached." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function saveQuestion(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ id: z.string().uuid(), question: questionSchema }).safeParse({
    id: form.get("id"),
    question: form.get("question"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check that entry." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const updated = await updateQuestion(auth.userId, parsed.data.id, parsed.data.question);
    if (!updated) return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  revalidatePath(`/p/${parsed.data.id}`);
  return {};
}

export async function toggleClosed(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ id: z.string().uuid(), closed: z.enum(["true", "false"]) }).safeParse({
    id: form.get("id"),
    closed: form.get("closed"),
  });
  if (!parsed.success) return { error: "Not found." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const updated = await setClosed(auth.userId, parsed.data.id, parsed.data.closed === "true");
    if (!updated) return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  revalidatePath(`/p/${parsed.data.id}`);
  return {};
}

export async function removePoll(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.string().uuid().safeParse(form.get("id"));
  if (!parsed.success) return { error: "Not found." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    await deletePoll(auth.userId, parsed.data);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function vote(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ pollId: z.string().uuid(), optionId: z.string().uuid() }).safeParse({
    pollId: form.get("pollId"),
    optionId: form.get("optionId"),
  });
  if (!parsed.success) return { error: "Pick one." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const result = await castVote(auth.userId, parsed.data.pollId, parsed.data.optionId);
    if (result === "voted") return { error: "Already voted." };
    if (result === "closed") return { error: "Closed." };
    if (result === "missing") return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/p/${parsed.data.pollId}`);
  revalidatePath("/");
  return {};
}
