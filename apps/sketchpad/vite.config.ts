import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), sketchpadApi(env)],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
    },
  }
})

function sketchpadApi(env: Record<string, string>): Plugin {
  const attach = (middlewares: { use: (handler: (req: NodeRequest, res: NodeResponse, next: () => void) => void) => void }) => {
    middlewares.use((req, res, next) => {
      const url = req.url ?? ''
      if (!url.startsWith('/api/boards')) {
        next()
        return
      }
      if (!process.env.DATABASE_URL && env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL
      if (!process.env.CLERK_SECRET_KEY && env.CLERK_SECRET_KEY) process.env.CLERK_SECRET_KEY = env.CLERK_SECRET_KEY
      void serveApi(req, res).catch(() => {
        res.statusCode = 500
        res.end('unavailable')
      })
    })
  }
  return {
    name: 'sketchpad-api',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}

interface NodeRequest extends AsyncIterable<Buffer | string> {
  url?: string
  method?: string
  headers: Record<string, string | string[] | undefined>
}

interface NodeResponse {
  statusCode: number
  setHeader: (name: string, value: string) => void
  end: (body?: Buffer | string) => void
}

async function serveApi(req: NodeRequest, res: NodeResponse): Promise<void> {
  const { handleBoards } = await import('./src/server/boards')
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'host' || key === 'connection' || key === 'content-length') continue
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }
  const chunks: Buffer[] = []
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const response = await handleBoards(
    new Request(`http://127.0.0.1${req.url ?? '/api/boards'}`, {
      method: req.method,
      headers,
      body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
    }),
  )
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}
