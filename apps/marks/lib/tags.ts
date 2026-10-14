const TAG = /^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/;

export function parseTags(input: string): { ok: true; tags: string[] } | { ok: false; error: string } {
  const parts = input
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length > 8) return { ok: false, error: "Use up to 8 tags." };
  const tags: string[] = [];
  for (const tag of parts) {
    if (!TAG.test(tag)) return { ok: false, error: "Tags use letters, numbers, and dashes." };
    if (!tags.includes(tag)) tags.push(tag);
  }
  return { ok: true, tags };
}
