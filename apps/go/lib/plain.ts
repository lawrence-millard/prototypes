export function plain(message: string, status: number) {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${message}</title><style>html,body{margin:0;min-height:100dvh}body{display:grid;place-items:center;background:#f6f6f6;color:#5a5a5a;font:500 16px/1.35 "Open Runde",ui-sans-serif,system-ui,sans-serif}@media (prefers-color-scheme:dark){body{background:#000;color:#a2a2a2}}</style></head><body><p>${message}</p></body></html>`
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" },
  })
}
