export const windowSeconds = 600
export const writeLimit = 60

export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS cards_decks (
    id uuid PRIMARY KEY,
    user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 200),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS cards_decks_user_idx ON cards_decks (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS cards_cards (
    id uuid PRIMARY KEY,
    deck_id uuid NOT NULL REFERENCES cards_decks (id) ON DELETE CASCADE,
    user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 200),
    front text NOT NULL CHECK (char_length(front) BETWEEN 1 AND 2000),
    back text NOT NULL CHECK (char_length(back) BETWEEN 1 AND 2000),
    ease numeric(3,2) NOT NULL DEFAULT 2.50 CHECK (ease >= 1.30 AND ease <= 5.00),
    interval_days integer NOT NULL DEFAULT 0 CHECK (interval_days >= 0 AND interval_days <= 36500),
    repetitions integer NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    due_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS cards_cards_deck_idx ON cards_cards (user_id, deck_id, due_at)`,
  `CREATE TABLE IF NOT EXISTS cards_limits (
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
  SELECT (SELECT count FROM lim)::int AS count, (SELECT id::text FROM wrote) AS id`
}

export const listDecksSql = `SELECT d.id::text, d.name,
  count(c.id)::int AS cards,
  count(c.id) FILTER (WHERE c.due_at <= now())::int AS due
  FROM cards_decks d
  LEFT JOIN cards_cards c ON c.deck_id = d.id AND c.user_id = d.user_id
  WHERE d.user_id = $1
  GROUP BY d.id
  ORDER BY d.created_at DESC
  LIMIT 50`

export const deckSql = `SELECT d.id::text AS deck_id, d.name,
  c.id::text AS card_id, c.front, c.back, c.ease::float8 AS ease,
  c.interval_days, c.repetitions, c.due_at, c.created_at
  FROM cards_decks d
  LEFT JOIN cards_cards c ON c.deck_id = d.id AND c.user_id = d.user_id
  WHERE d.id = $1::uuid AND d.user_id = $2
  ORDER BY c.created_at ASC`

export const cardStateSql = `SELECT ease::float8 AS ease, interval_days, repetitions
  FROM cards_cards
  WHERE id = $1::uuid AND user_id = $2`

export const createDeckSql = limited(
  'cards_limits',
  `INSERT INTO cards_decks (id, user_id, name)
    SELECT $3::uuid, $4, $5
    WHERE (SELECT count FROM lim) <= $6::int
    ON CONFLICT (id) DO NOTHING
    RETURNING id`,
)

export const renameDeckSql = limited(
  'cards_limits',
  `UPDATE cards_decks SET name = $5
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $6::int
    RETURNING id`,
)

export const deleteDeckSql = limited(
  'cards_limits',
  `DELETE FROM cards_decks
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $5::int
    RETURNING id`,
)

export const createCardSql = limited(
  'cards_limits',
  `INSERT INTO cards_cards (id, deck_id, user_id, front, back)
    SELECT $3::uuid, $4::uuid, $5, $6, $7
    WHERE (SELECT count FROM lim) <= $8::int
      AND EXISTS (SELECT 1 FROM cards_decks WHERE id = $4::uuid AND user_id = $5)
    ON CONFLICT (id) DO NOTHING
    RETURNING id`,
)

export const updateCardSql = limited(
  'cards_limits',
  `UPDATE cards_cards SET front = $5, back = $6
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $7::int
    RETURNING id`,
)

export const deleteCardSql = limited(
  'cards_limits',
  `DELETE FROM cards_cards
    WHERE id = $3::uuid AND user_id = $4 AND (SELECT count FROM lim) <= $5::int
    RETURNING id`,
)

export const reviewSql = limited(
  'cards_limits',
  `UPDATE cards_cards
    SET ease = $5, interval_days = $6, repetitions = $7, due_at = $8
    WHERE id = $3::uuid AND user_id = $4 AND repetitions = $9::int AND (SELECT count FROM lim) <= $10::int
    RETURNING id`,
)
