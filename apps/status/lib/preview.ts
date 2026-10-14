import type { Monitor } from "@/lib/list-state";

const hours = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

export function previewMonitors(): { items: Monitor[]; limited: boolean } {
  const items: Monitor[] = [
    { id: "11111111-1111-4111-8111-111111111111", url: "https://millard.ink", label: "millard.ink", ok: true, statusCode: 200, latencyMs: 84, error: null, at: hours(0.2) },
    { id: "22222222-2222-4222-8222-222222222222", url: "https://linear.app", label: "Linear", ok: true, statusCode: 200, latencyMs: 140, error: null, at: hours(1) },
    { id: "33333333-3333-4333-8333-333333333333", url: "https://example.com/down", label: "Example", ok: false, statusCode: 503, latencyMs: 420, error: "down", at: hours(5) },
  ];
  return { items, limited: false };
}
