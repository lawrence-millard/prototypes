"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writer } from "@/lib/gate";
import { actionError, type ActionState } from "@/lib/errors";
import { deleteMonitor, insertMonitor, loadMonitors, updateLabel } from "@/lib/queries";
import { resolvePublic } from "@/lib/probe";
import { parsePublicUrl, UrlError } from "@/lib/ssrf";

const labelSchema = z.string().trim().min(1, "Add a label.").max(120, "Label is too long.");

export async function createMonitor(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      url: z.string().trim().min(1, "Enter an http or https URL.").max(2000),
      label: z.string().trim().max(120),
    })
    .safeParse({ url: form.get("url"), label: form.get("label") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check that entry." };
  let url: URL;
  try {
    url = parsePublicUrl(parsed.data.url);
  } catch (error) {
    return { error: error instanceof UrlError ? error.message : "That URL is not allowed." };
  }
  const label = labelSchema.safeParse(parsed.data.label || url.hostname.replace(/^www\./, "").slice(0, 120));
  if (!label.success) return { error: label.error.issues[0]?.message ?? "Add a label." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    await resolvePublic(url.hostname);
    const saved = await insertMonitor(auth.userId, url.href, label.data);
    if (saved === "limit") return { error: "Limit reached." };
    if (saved === "exists") return { error: "Already added." };
  } catch (error) {
    if (error instanceof UrlError) return { error: error.message };
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function saveLabel(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({ id: z.string().uuid(), label: labelSchema })
    .safeParse({ id: form.get("id"), label: form.get("label") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check that entry." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const updated = await updateLabel(auth.userId, parsed.data.id, parsed.data.label);
    if (!updated) return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function removeMonitor(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.string().uuid().safeParse(form.get("id"));
  if (!parsed.success) return { error: "Not found." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    await deleteMonitor(auth.userId, parsed.data);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function refreshMonitors(): Promise<ActionState> {
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const loaded = await loadMonitors(auth.userId, true);
    if (loaded.limited) return { error: "Too many requests." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}
