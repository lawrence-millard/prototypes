export const windowSeconds = 600
export const writeLimit = 30

export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS focus_sessions (
    id uuid PRIMARY KEY,
    user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 200),
    kind text NOT NULL CHECK (kind IN ('focus', 'short', 'long')),
    seconds integer NOT NULL CHECK (seconds IN (300, 900, 1500)),
    label text NOT NULL DEFAULT '' CHECK (char_length(label) <= 80),
    completed_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS focus_sessions_user_idx ON focus_sessions (user_id, completed_at DESC)`,
  `CREATE TABLE IF NOT EXISTS focus_limits (
    bucket text PRIMARY KEY,
    window_start timestamptz NOT NULL,
    count integer NOT NULL
  )`,
]

export function limited(table: string, write: string, select = `(SELECT count FROM lim)::int AS count, (SELECT id::text FROM wrote) AS id`) {
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

export const listSql = `SELECT id::text, kind, seconds, label, completed_at
  FROM focus_sessions
  WHERE user_id = $1
  ORDER BY completed_at DESC
  LIMIT 40`

export const createSql = limited(
  'focus_limits',
  `INSERT INTO focus_sessions (id, user_id, kind, seconds, label)
    SELECT $3::uuid, $4, $5, $6::int, $7
    WHERE (SELECT count FROM lim) <= $8::int
    ON CONFLICT (id) DO NOTHING
    RETURNING id`,
  `(SELECT count FROM lim)::int AS count,
   COALESCE(
     (SELECT id::text FROM wrote),
     (SELECT id::text FROM focus_sessions WHERE id = $3::uuid AND user_id = $4)
   ) AS id`,
)

export const updateSql = limited(
  'focus_limits',
  `UPDATE focus_sessions
    SET label = $5
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $6::int
    RETURNING id`,
)

export const deleteSql = limited(
  'focus_limits',
  `DELETE FROM focus_sessions
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $5::int
    RETURNING id`,
)
