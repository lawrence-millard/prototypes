import { handleBoards } from '../src/server/boards.js'

export function GET(request: Request) {
  return handleBoards(request)
}

export function PUT(request: Request) {
  return handleBoards(request)
}

export default async function handler(
  req: { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; on?: never },
  res: { status: (code: number) => { setHeader: (name: string, value: string) => void; send: (body: Buffer) => void } },
) {
  const request = await nodeRequest(req)
  const response = await handleBoards(request)
  const out = res.status(response.status)
  response.headers.forEach((value, key) => out.setHeader(key, value))
  out.send(Buffer.from(await response.arrayBuffer()))
}

async function nodeRequest(req: {
  method?: string
  url?: string
  headers: Record<string, string | string[] | undefined>
}): Promise<Request> {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'host' || key === 'connection' || key === 'content-length') continue
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }
  const chunks: Buffer[] = []
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const stream = req as unknown as AsyncIterable<Buffer | string>
    for await (const chunk of stream) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return new Request(`https://sketch.millard.ink${req.url ?? '/api/boards'}`, {
    method: req.method,
    headers,
    body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
  })
}
