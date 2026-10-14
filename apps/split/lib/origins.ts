export const origins = [
  "https://marks.millard.ink",
  "https://status.millard.ink",
  "https://poll.millard.ink",
  "https://split.millard.ink",
] as const;

export function redirectOrigins(): string[] {
  if (process.env.NODE_ENV === "production") return [...origins];
  return [...origins, "http://localhost:3000", "http://127.0.0.1:3000"];
}
