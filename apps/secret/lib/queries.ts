export const windowSeconds = 600
export const writeLimit = 10
export const openLimit = 30

export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS secret_links (
    id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{16,64}$'),
    user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 200),
    ciphertext text NOT NULL CHECK (char_length(ciphertext) BETWEEN 24 AND 20000),
    iv text NOT NULL CHECK (iv ~ '^[A-Za-z0-9+/]{16}$'),
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS secret_links_user_idx ON secret_links (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS secret_limits (
    bucket text PRIMARY KEY,
    window_start timestamptz NOT NULL,
    count integer NOT NULL
  )`,
]

export function limited(table: string, write: string) {
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
  SELECT (SELECT count FROM lim)::int AS count, (SELECT id FROM wrote) AS id`
}

export const purgeSql = `DELETE FROM secret_links WHERE user_id = $1 AND expires_at <= now()`

export const listSql = `SELECT id, expires_at, created_at
  FROM secret_links
  WHERE user_id = $1 AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 50`

export const createSql = limited(
  'secret_limits',
  `INSERT INTO secret_links (id, user_id, ciphertext, iv, expires_at)
    SELECT $3, $4, $5, $6, $7
    WHERE (SELECT count FROM lim) <= $8::int
    RETURNING id`,
)

export const updateSql = limited(
  'secret_limits',
  `UPDATE secret_links SET expires_at = $5
    WHERE id = $3 AND user_id = $4 AND expires_at > now() AND (SELECT count FROM lim) <= $6::int
    RETURNING id`,
)

export const deleteSql = limited(
  'secret_limits',
  `DELETE FROM secret_links
    WHERE id = $3 AND user_id = $4 AND (SELECT count FROM lim) <= $5::int
    RETURNING id`,
)

export const openSql = `WITH lim AS (
  INSERT INTO secret_limits (bucket, window_start, count)
  VALUES ($1, now(), 1)
  ON CONFLICT (bucket) DO UPDATE SET
    count = CASE
      WHEN secret_limits.window_start < now() - ($2::int * interval '1 second') THEN 1
      ELSE secret_limits.count + 1
    END,
    window_start = CASE
      WHEN secret_limits.window_start < now() - ($2::int * interval '1 second') THEN now()
      ELSE secret_limits.window_start
    END
  RETURNING count
),
removed AS (
  DELETE FROM secret_links
  WHERE id = $3
    AND (
      expires_at <= now()
      OR (SELECT count FROM lim) <= $4::int
    )
  RETURNING ciphertext, iv, (expires_at > now()) AS fresh
)
SELECT
  (SELECT count FROM lim)::int AS count,
  (SELECT ciphertext FROM removed WHERE fresh) AS ciphertext,
  (SELECT iv FROM removed WHERE fresh) AS iv,
  (SELECT fresh FROM removed) AS fresh`
