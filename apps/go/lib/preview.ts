import type { Link } from "./data"

const hour = 3_600_000

export function previewLinks(now = Date.now()): Link[] {
  return [
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f51",
      code: "docs",
      url: "https://example.com/docs",
      clicks: 128,
      createdAt: new Date(now - 2 * hour).toISOString(),
    },
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f52",
      code: "notes",
      url: "https://example.com/notes",
      clicks: 14,
      createdAt: new Date(now - 26 * hour).toISOString(),
    },
    {
      id: "d5b0b5b2-6c3e-4a1e-9f4a-0b1c2d3e4f53",
      code: "lab",
      url: "https://example.com/lab",
      clicks: 3,
      createdAt: new Date(now - 5 * 24 * hour).toISOString(),
    },
  ]
}
