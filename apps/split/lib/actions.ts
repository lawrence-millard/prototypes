"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writer } from "@/lib/gate";
import { actionError, type ActionState } from "@/lib/errors";
import { parseCents } from "@/lib/money";
import {
  deleteExpense,
  deleteGroup,
  deleteMember,
  insertExpense,
  insertGroup,
  insertMember,
  renameGroup,
  updateExpense,
} from "@/lib/queries";

const nameSchema = z.string().trim().min(1, "Add a name.").max(40, "Name is too long.");
const memoSchema = z.string().trim().min(1, "Add a memo.").max(80, "Memo is too long.");
const amountSchema = z.string().trim().refine((value) => parseCents(value) !== null, "Enter an amount.");

export async function createGroup(_prev: ActionState, form: FormData): Promise<ActionState & { id?: string }> {
  const parsed = nameSchema.safeParse(form.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Add a name." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const id = await insertGroup(auth.userId, parsed.data);
    if (!id) return { error: "Limit reached." };
    revalidatePath("/");
    return { id };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveGroupName(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ id: z.string().uuid(), name: nameSchema }).safeParse({ id: form.get("id"), name: form.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Add a name." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const updated = await renameGroup(auth.userId, parsed.data.id, parsed.data.name);
    if (!updated) return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  revalidatePath(`/g/${parsed.data.id}`);
  return {};
}

export async function removeGroup(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.string().uuid().safeParse(form.get("id"));
  if (!parsed.success) return { error: "Not found." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    await deleteGroup(auth.userId, parsed.data);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function addMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ groupId: z.string().uuid(), name: nameSchema }).safeParse({
    groupId: form.get("groupId"),
    name: form.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Add a name." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const result = await insertMember(auth.userId, parsed.data.groupId, parsed.data.name);
    if (result === "exists") return { error: "Already added." };
    if (result === "limit") return { error: "Limit reached." };
    if (result === "missing") return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/g/${parsed.data.groupId}`);
  return {};
}

export async function removeMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ groupId: z.string().uuid(), memberId: z.string().uuid() }).safeParse({
    groupId: form.get("groupId"),
    memberId: form.get("memberId"),
  });
  if (!parsed.success) return { error: "Not found." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const result = await deleteMember(auth.userId, parsed.data.groupId, parsed.data.memberId);
    if (result === "used") return { error: "Remove their expenses first." };
    if (result === "missing") return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/g/${parsed.data.groupId}`);
  return {};
}

export async function addExpense(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      groupId: z.string().uuid(),
      payerId: z.string().uuid(),
      memo: memoSchema,
      amount: amountSchema,
      memberId: z.array(z.string().uuid()).min(1, "Pick who shares."),
    })
    .safeParse({
      groupId: form.get("groupId"),
      payerId: form.get("payerId"),
      memo: form.get("memo"),
      amount: form.get("amount"),
      memberId: form.getAll("memberId").map(String),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check that entry." };
  const amount = parseCents(parsed.data.amount);
  if (amount === null) return { error: "Enter an amount." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const saved = await insertExpense(auth.userId, parsed.data.groupId, parsed.data.payerId, parsed.data.memo, amount, [...new Set(parsed.data.memberId)]);
    if (!saved) return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/g/${parsed.data.groupId}`);
  return {};
}

export async function saveExpense(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      groupId: z.string().uuid(),
      expenseId: z.string().uuid(),
      memo: memoSchema,
      amount: amountSchema,
    })
    .safeParse({
      groupId: form.get("groupId"),
      expenseId: form.get("expenseId"),
      memo: form.get("memo"),
      amount: form.get("amount"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check that entry." };
  const amount = parseCents(parsed.data.amount);
  if (amount === null) return { error: "Enter an amount." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const updated = await updateExpense(auth.userId, parsed.data.groupId, parsed.data.expenseId, parsed.data.memo, amount);
    if (!updated) return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/g/${parsed.data.groupId}`);
  return {};
}

export async function removeExpense(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ groupId: z.string().uuid(), expenseId: z.string().uuid() }).safeParse({
    groupId: form.get("groupId"),
    expenseId: form.get("expenseId"),
  });
  if (!parsed.success) return { error: "Not found." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    await deleteExpense(auth.userId, parsed.data.groupId, parsed.data.expenseId);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/g/${parsed.data.groupId}`);
  return {};
}
