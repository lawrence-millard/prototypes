export function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function hostLabel(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return "";
  }
}
