import type { Paste } from "./data"

const hour = 3_600_000

export function previewPastes(now = Date.now()): Paste[] {
  return [
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f61",
      body: "Ship the draft before noon.\n\nLeave the open questions at the bottom.",
      expiresAt: new Date(now + 6 * 24 * hour).toISOString(),
      createdAt: new Date(now - 3 * hour).toISOString(),
    },
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f62",
      body: "Routes, errors, and limits.",
      expiresAt: new Date(now + 2 * hour).toISOString(),
      createdAt: new Date(now - 26 * hour).toISOString(),
    },
  ]
}
