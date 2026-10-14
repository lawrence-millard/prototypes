import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import type { Choice, PollItem } from "@/lib/list-state";

export const listPolls = cache(async (userId: string): Promise<PollItem[]> => {
  const sql = await db();
  const rows = await sql`
    SELECT p.id, p.question, p.closed,
      (SELECT count(*)::int FROM poll_votes v WHERE v.poll_id = p.id) AS votes
    FROM poll_polls p
    WHERE p.user_id = ${userId}
    ORDER BY p.created_at DESC
    LIMIT 50
  `;
  return rows.map((row) => ({
    id: String(row.id),
    question: String(row.question),
    closed: Boolean(row.closed),
    votes: Number(row.votes ?? 0),
  }));
});

export async function insertPoll(userId: string, question: string, options: string[]): Promise<boolean> {
  const sql = await db();
  const id = crypto.randomUUID();
  const packed = options.join("\u001f");
  const rows = await sql`
    WITH room AS (
      SELECT count(*) AS n FROM poll_polls WHERE user_id = ${userId}
    ),
    poll AS (
      INSERT INTO poll_polls (id, user_id, question)
      SELECT ${id}, ${userId}, ${question}
      FROM room
      WHERE n < 50
      RETURNING id
    ),
    opts AS (
      INSERT INTO poll_options (id, poll_id, user_id, label, position)
      SELECT gen_random_uuid()::text, poll.id, ${userId}, btrim(t.label), (t.ord - 1)::int
      FROM poll
      CROSS JOIN unnest(string_to_array(${packed}, ${"\u001f"})) WITH ORDINALITY AS t(label, ord)
      WHERE btrim(t.label) <> ''
      RETURNING id
    ),
    bad AS (
      DELETE FROM poll_polls
      WHERE id = ${id} AND user_id = ${userId} AND (SELECT count(*) FROM opts) <> ${options.length}
      RETURNING id
    )
    SELECT (SELECT count(*)::int FROM poll) AS inserted, (SELECT count(*)::int FROM bad) AS removed
  `;
  return Number(rows[0]?.inserted ?? 0) === 1 && Number(rows[0]?.removed ?? 0) === 0;
}

export async function updateQuestion(userId: string, id: string, question: string): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    UPDATE poll_polls SET question = ${question}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length === 1;
}

export async function setClosed(userId: string, id: string, closed: boolean): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    UPDATE poll_polls SET closed = ${closed}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length === 1;
}

export async function deletePoll(userId: string, id: string): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM poll_polls WHERE id = ${id} AND user_id = ${userId}`;
}

export type PublicPoll = {
  question: string;
  closed: boolean;
  owner: boolean;
  options: Choice[];
};

export const getPoll = cache(async (pollId: string, userId: string): Promise<PublicPoll | null> => {
  const sql = await db();
  const rows = await sql`
    SELECT p.question, p.closed, (p.user_id = ${userId}) AS owner,
      o.id, o.label, o.position,
      count(v.user_id)::int AS votes,
      coalesce(bool_or(v.user_id = ${userId}), false) AS mine
    FROM poll_polls p
    JOIN poll_options o ON o.poll_id = p.id
    LEFT JOIN poll_votes v ON v.option_id = o.id AND v.poll_id = p.id
    WHERE p.id = ${pollId}
    GROUP BY p.id, o.id
    ORDER BY o.position
  `;
  if (!rows.length) return null;
  return {
    question: String(rows[0].question),
    closed: Boolean(rows[0].closed),
    owner: Boolean(rows[0].owner),
    options: rows.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      votes: Number(row.votes ?? 0),
      mine: Boolean(row.mine),
    })),
  };
});

export async function castVote(userId: string, pollId: string, optionId: string): Promise<"ok" | "missing" | "closed" | "voted"> {
  const sql = await db();
  const rows = await sql`
    WITH poll AS (
      SELECT id, closed FROM poll_polls WHERE id = ${pollId}
    ),
    existing AS (
      SELECT poll_id FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${userId}
    ),
    ins AS (
      INSERT INTO poll_votes (poll_id, option_id, user_id)
      SELECT poll.id, o.id, ${userId}
      FROM poll
      JOIN poll_options o ON o.poll_id = poll.id AND o.id = ${optionId}
      WHERE poll.closed = false AND NOT EXISTS (SELECT 1 FROM existing)
      ON CONFLICT (poll_id, user_id) DO NOTHING
      RETURNING poll_id
    )
    SELECT
      (SELECT count(*)::int FROM poll) AS found,
      coalesce((SELECT closed FROM poll), false) AS closed,
      (SELECT count(*)::int FROM existing) AS voted,
      (SELECT count(*)::int FROM ins) AS inserted
  `;
  const row = rows[0];
  if (!Number(row?.found ?? 0)) return "missing";
  if (Number(row?.inserted ?? 0) === 1) return "ok";
  if (Number(row?.voted ?? 0) > 0) return "voted";
  if (row?.closed) return "closed";
  return "missing";
}
