import type { NoteDetail } from "./data"

const hour = 3_600_000

export function previewNotes(now = Date.now()): NoteDetail[] {
  return [
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f71",
      title: "Launch checklist",
      body: "Three items left for Friday.\n\n- Copy\n- Empty state\n- Sign-in",
      updatedAt: new Date(now - 2 * hour).toISOString(),
    },
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f72",
      title: "API draft",
      body: "Endpoints and error cases.\n\n`GET /notes` returns titles only.",
      updatedAt: new Date(now - 26 * hour).toISOString(),
    },
  ]
}
