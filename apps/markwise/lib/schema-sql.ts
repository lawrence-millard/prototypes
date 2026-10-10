export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_active_on text,
  exam_date text,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS enrolments (
  user_id text NOT NULL REFERENCES users(id),
  subject text NOT NULL,
  board text NOT NULL,
  spec_code text NOT NULL,
  target_grade text NOT NULL DEFAULT 'A',
  PRIMARY KEY (user_id, subject)
);
CREATE TABLE IF NOT EXISTS topics (
  id text PRIMARY KEY,
  subject text NOT NULL,
  spec_code text NOT NULL,
  spec_ref text NOT NULL,
  name text NOT NULL,
  plan_title text NOT NULL,
  theme text NOT NULL
);
CREATE TABLE IF NOT EXISTS questions (
  id text PRIMARY KEY,
  topic_id text NOT NULL REFERENCES topics(id),
  spec_code text NOT NULL,
  type text NOT NULL,
  command_word text,
  marks integer NOT NULL,
  stem text NOT NULL,
  breadcrumb text NOT NULL,
  choices jsonb,
  correct_choice text,
  short_points jsonb,
  point_labels jsonb,
  ao_weights jsonb,
  levels jsonb,
  indicative_content jsonb,
  exemplar_key text,
  quiz_slug text,
  quiz_order integer
);
CREATE TABLE IF NOT EXISTS exemplars (
  id text PRIMARY KEY,
  exemplar_key text NOT NULL,
  answer text NOT NULL,
  level integer NOT NULL,
  marks integer NOT NULL,
  note text NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  question_id text NOT NULL REFERENCES questions(id),
  answer text NOT NULL,
  answer_hash text,
  total integer NOT NULL,
  level integer,
  feedback jsonb NOT NULL,
  flagged boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mastery (
  user_id text NOT NULL REFERENCES users(id),
  topic_id text NOT NULL REFERENCES topics(id),
  p_known real NOT NULL,
  PRIMARY KEY (user_id, topic_id)
);
CREATE TABLE IF NOT EXISTS drafts (
  user_id text NOT NULL REFERENCES users(id),
  question_id text NOT NULL REFERENCES questions(id),
  answer text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
CREATE TABLE IF NOT EXISTS chats (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  subject text NOT NULL,
  topic_name text NOT NULL,
  spec_label text NOT NULL,
  stem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  chat_id text NOT NULL REFERENCES chats(id),
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id text NOT NULL REFERENCES users(id),
  day text NOT NULL,
  marks integer NOT NULL DEFAULT 0,
  tutor_turns integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS mark_cache (
  question_id text NOT NULL,
  answer_hash text NOT NULL,
  result jsonb NOT NULL,
  PRIMARY KEY (question_id, answer_hash)
);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_chat_idx ON messages (chat_id, created_at);
`.trim();
