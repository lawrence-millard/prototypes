"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writer } from "@/lib/gate";
import { actionError, type ActionState } from "@/lib/errors";
import { deleteBookmark, insertBookmark, updateBookmark } from "@/lib/queries";
import { parseTags } from "@/lib/tags";
import { hostLabel, normalizeHttpUrl } from "@/lib/url";

const titleSchema = z.string().trim().min(1, "Add a title.").max(120, "Title is too long.");

export async function createBookmark(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      url: z.string().trim().min(1, "Enter an http or https URL.").max(2000),
      title: z.string().trim().max(120),
      tags: z.string().max(200),
    })
    .safeParse({ url: form.get("url"), title: form.get("title"), tags: form.get("tags") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check that entry." };
  const url = normalizeHttpUrl(parsed.data.url);
  if (!url) return { error: "Enter an http or https URL." };
  const tags = parseTags(parsed.data.tags);
  if (!tags.ok) return { error: tags.error };
  const title = titleSchema.safeParse(parsed.data.title || hostLabel(url));
  if (!title.success) return { error: title.error.issues[0]?.message ?? "Add a title." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const saved = await insertBookmark(auth.userId, url, title.data, tags.tags);
    if (!saved) return { error: "Limit reached." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function saveBookmark(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      id: z.string().uuid(),
      title: titleSchema,
      tags: z.string().max(200),
    })
    .safeParse({ id: form.get("id"), title: form.get("title"), tags: form.get("tags") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check that entry." };
  const tags = parseTags(parsed.data.tags);
  if (!tags.ok) return { error: tags.error };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    const updated = await updateBookmark(auth.userId, parsed.data.id, parsed.data.title, tags.tags);
    if (!updated) return { error: "Not found." };
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}

export async function removeBookmark(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.string().uuid().safeParse(form.get("id"));
  if (!parsed.success) return { error: "Not found." };
  const auth = await writer();
  if (!auth.ok) return { error: auth.error };
  try {
    await deleteBookmark(auth.userId, parsed.data);
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/");
  return {};
}
