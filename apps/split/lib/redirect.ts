const POLL_PATH = /^\/p\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GROUP_PATH = /^\/g\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function safeNext(value: unknown, kind: "poll" | "group" | "none" = "none"): string {
  if (typeof value !== "string" || value.length > 80 || value.includes("//") || value.includes("\\")) return "/";
  if (value === "/") return "/";
  if (kind === "poll" && POLL_PATH.test(value)) return value;
  if (kind === "group" && GROUP_PATH.test(value)) return value;
  return "/";
}
