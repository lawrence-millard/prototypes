export const windowSeconds = 600
export const writeLimit = 30

export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS soon_events (
    id uuid PRIMARY KEY,
    user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 200),
    slug text NOT NULL UNIQUE CHECK (slug ~ '^[A-Za-z0-9_-]{8,32}$'),
    title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
    happens_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS soon_events_user_idx ON soon_events (user_id, happens_at)`,
  `CREATE TABLE IF NOT EXISTS soon_limits (
    bucket text PRIMARY KEY,
    window_start timestamptz NOT NULL,
    count integer NOT NULL
  )`,
]

export function limited(table: string, write: string, select = `(SELECT count FROM lim)::int AS count, (SELECT id::text FROM wrote) AS id, (SELECT slug FROM wrote) AS slug`) {
  if (!/^[a-z_]+$/.test(table)) throw new Error('bad table')
  return `WITH lim AS (
    INSERT INTO ${table} (bucket, window_start, count)
    VALUES ($1, now(), 1)
    ON CONFLICT (bucket) DO UPDATE SET
      count = CASE
        WHEN ${table}.window_start < now() - ($2::int * interval '1 second') THEN 1
        ELSE ${table}.count + 1
      END,
      window_start = CASE
        WHEN ${table}.window_start < now() - ($2::int * interval '1 second') THEN now()
        ELSE ${table}.window_start
      END
    RETURNING count
  ),
  wrote AS (
    ${write}
  )
  SELECT ${select}`
}

export const listSql = `SELECT id::text, slug, title, note, happens_at
  FROM soon_events
  WHERE user_id = $1
  ORDER BY happens_at ASC
  LIMIT 50`

export const publicSql = `SELECT title, note, happens_at
  FROM soon_events
  WHERE slug = $1`

export const createSql = limited(
  'soon_limits',
  `INSERT INTO soon_events (id, user_id, slug, title, note, happens_at)
    SELECT $3::uuid, $4, $5, $6, $7, $8
    WHERE (SELECT count FROM lim) <= $9::int
    RETURNING id, slug`,
)

export const updateSql = limited(
  'soon_limits',
  `UPDATE soon_events
    SET title = $5, note = $6, happens_at = $7
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $8::int
    RETURNING id, slug`,
)

export const deleteSql = limited(
  'soon_limits',
  `DELETE FROM soon_events
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $5::int
    RETURNING id, slug`,
)
