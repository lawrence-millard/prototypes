import { verifyToken } from '@clerk/backend'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { pushSchema, remoteBoardSchema, type PushChange, type RemoteBoard } from '../sync/contract'

const PARTIES = [
  'https://sketch.millard.ink',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
]

const LIMITS = { read: 60, write: 30 }

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS sketchpad_boards (
    owner_id text NOT NULL,
    id text NOT NULL,
    name text NOT NULL,
    doc jsonb NOT NULL,
    created_ms bigint NOT NULL,
    updated_ms bigint NOT NULL,
    deleted_ms bigint,
    PRIMARY KEY (owner_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS sketchpad_boards_owner_idx
    ON sketchpad_boards (owner_id, updated_ms DESC)`,
  `CREATE TABLE IF NOT EXISTS sketchpad_rate (
    owner_id text NOT NULL,
    action text NOT NULL,
    window_start timestamptz NOT NULL,
    hits integer NOT NULL,
    PRIMARY KEY (owner_id, action, window_start)
  )`,
]

export interface SyncDeps {
  verify: (token: string) => Promise<string | null>
  takeToken: (ownerId: string, action: 'read' | 'write') => Promise<boolean>
  readBoards: (ownerId: string) => Promise<RemoteBoard[]>
  writeBoards: (ownerId: string, changes: PushChange[]) => Promise<void>
  unavailable?: boolean
}

type Sql = NeonQueryFunction<false, false>

let schemaReady: Promise<void> | null = null

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

function bearer(request: Request): string {
  const header = request.headers.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

export async function handleBoards(request: Request, deps?: SyncDeps): Promise<Response> {
  const resolved = deps ?? (await liveDeps())
  if (resolved.unavailable) return json({ error: 'unavailable' }, 503)
  if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'method' }, 405)

  const token = bearer(request)
  if (!token) return json({ error: 'unauthorized' }, 401)
  const ownerId = await resolved.verify(token)
  if (!ownerId) return json({ error: 'unauthorized' }, 401)

  const action = request.method === 'GET' ? 'read' : 'write'
  if (!(await resolved.takeToken(ownerId, action))) return json({ error: 'rate' }, 429)

  if (request.method === 'GET') {
    return json({ boards: await resolved.readBoards(ownerId) }, 200)
  }

  const text = await request.text()
  if (text.length > 1_000_000) return json({ error: 'invalid' }, 413)
  let payload: unknown
  try {
    payload = JSON.parse(text) as unknown
  } catch {
    return json({ error: 'invalid' }, 400)
  }
  const parsed = pushSchema.safeParse(payload)
  if (!parsed.success) return json({ error: 'invalid' }, 400)
  if (parsed.data.changes.length > 0) await resolved.writeBoards(ownerId, parsed.data.changes)
  return json({ ok: true }, 200)
}

async function liveDeps(): Promise<SyncDeps> {
  const secret = process.env.CLERK_SECRET_KEY?.trim() ?? ''
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? ''
  if (!secret || !databaseUrl) return unavailable()
  const sql = neon(databaseUrl)
  await ensureSchema(sql)
  return {
    async verify(token) {
      try {
        const payload = await verifyToken(token, { secretKey: secret, authorizedParties: PARTIES })
        return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null
      } catch {
        return null
      }
    },
    takeToken: (ownerId, action) => allow(sql, ownerId, action),
    readBoards: (ownerId) => readBoards(sql, ownerId),
    writeBoards: (ownerId, changes) => writeBoards(sql, ownerId, changes),
  }
}

function unavailable(): SyncDeps {
  return {
    unavailable: true,
    verify: async () => null,
    takeToken: async () => false,
    readBoards: async () => [],
    writeBoards: async () => undefined,
  }
}

function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of SCHEMA) await sql.query(statement)
    })().catch((error: unknown) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}

async function allow(sql: Sql, ownerId: string, action: 'read' | 'write'): Promise<boolean> {
  const rows = (await sql.query(
    `WITH purged AS (
      DELETE FROM sketchpad_rate
      WHERE owner_id = $1 AND window_start < now() - interval '1 hour'
      RETURNING 1
    )
    INSERT INTO sketchpad_rate (owner_id, action, window_start, hits)
    VALUES ($1, $2, date_trunc('minute', now()), 1)
    ON CONFLICT (owner_id, action, window_start)
    DO UPDATE SET hits = sketchpad_rate.hits + 1
    RETURNING hits`,
    [ownerId, action],
  )) as Array<{ hits: number }>
  return Number(rows[0]?.hits ?? 0) <= LIMITS[action]
}

async function readBoards(sql: Sql, ownerId: string): Promise<RemoteBoard[]> {
  const rows = (await sql.query(
    `SELECT id, name, doc, created_ms, updated_ms, deleted_ms
     FROM sketchpad_boards
     WHERE owner_id = $1
     ORDER BY updated_ms DESC
     LIMIT 200`,
    [ownerId],
  )) as Array<{
    id: string
    name: string
    doc: unknown
    created_ms: number | string
    updated_ms: number | string
    deleted_ms: number | string | null
  }>
  const boards: RemoteBoard[] = []
  for (const row of rows) {
    const doc = row.doc && typeof row.doc === 'object' ? (row.doc as Record<string, unknown>) : {}
    const parsed = remoteBoardSchema.safeParse({
      id: row.id,
      name: row.name,
      createdAt: Number(row.created_ms),
      updatedAt: Number(row.updated_ms),
      deletedAt: row.deleted_ms == null ? null : Number(row.deleted_ms),
      sample: doc.sample === true,
      shapes: Array.isArray(doc.shapes) ? doc.shapes : [],
      connectors: Array.isArray(doc.connectors) ? doc.connectors : [],
    })
    if (parsed.success) boards.push(parsed.data)
  }
  return boards
}

async function writeBoards(sql: Sql, ownerId: string, changes: PushChange[]): Promise<void> {
  const rows = changes.map((change) => ({
    id: change.id,
    name: change.name,
    doc: {
      sample: change.sample === true,
      shapes: change.deleted ? [] : (change.shapes ?? []),
      connectors: change.deleted ? [] : (change.connectors ?? []),
    },
    created_ms: change.createdAt,
    updated_ms: change.updatedAt,
    deleted_ms: change.deleted ? change.updatedAt : null,
  }))
  await sql.query(
    `INSERT INTO sketchpad_boards (owner_id, id, name, doc, created_ms, updated_ms, deleted_ms)
     SELECT $1, x.id, x.name, x.doc, x.created_ms, x.updated_ms, x.deleted_ms
     FROM jsonb_to_recordset($2::jsonb) AS x(
       id text,
       name text,
       doc jsonb,
       created_ms bigint,
       updated_ms bigint,
       deleted_ms bigint
     )
     ON CONFLICT (owner_id, id) DO UPDATE SET
       name = EXCLUDED.name,
       doc = EXCLUDED.doc,
       updated_ms = EXCLUDED.updated_ms,
       deleted_ms = EXCLUDED.deleted_ms
     WHERE sketchpad_boards.updated_ms < EXCLUDED.updated_ms
        OR (
          sketchpad_boards.updated_ms = EXCLUDED.updated_ms
          AND EXCLUDED.deleted_ms IS NOT NULL
          AND sketchpad_boards.deleted_ms IS NULL
        )`,
    [ownerId, JSON.stringify(rows)],
  )
}
