import type { Bookmark } from "@/lib/list-state";

const hours = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

const bookmarks: Bookmark[] = [
  { id: "11111111-1111-4111-8111-111111111111", url: "https://linear.app", title: "Linear", tags: ["work"], createdAt: hours(2) },
  { id: "22222222-2222-4222-8222-222222222222", url: "https://vercel.com/docs", title: "Vercel docs", tags: ["work", "read"], createdAt: hours(26) },
  { id: "33333333-3333-4333-8333-333333333333", url: "https://millard.ink", title: "millard.ink", tags: ["read"], createdAt: hours(72) },
];

export function previewBookmarks(tag: string | null): { bookmarks: Bookmark[]; tags: string[] } {
  const tags = ["read", "work"];
  const list = tag ? bookmarks.filter((item) => item.tags.includes(tag)) : bookmarks;
  return { bookmarks: list, tags };
}
