import "server-only";

import { cache } from "react";
import { PREVIEW_USER_ID, previewOn } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Bookmark } from "@/lib/list-state";
import { previewBookmarks } from "@/lib/preview";

type Listed = { bookmarks: Bookmark[]; tags: string[] };

export const listBookmarks = cache(async (userId: string, tag: string | null): Promise<Listed> => {
  if (previewOn() && userId === PREVIEW_USER_ID) return previewBookmarks(tag);
  const sql = await db();
  const rows = await sql`
    WITH visible AS (
      SELECT b.id, b.url, b.title, b.created_at,
        coalesce((
          SELECT json_agg(t.name ORDER BY t.name)
          FROM marks_bookmark_tags bt
          JOIN marks_tags t ON t.id = bt.tag_id AND t.user_id = b.user_id
          WHERE bt.bookmark_id = b.id AND bt.user_id = b.user_id
        ), '[]'::json) AS tags
      FROM marks_bookmarks b
      WHERE b.user_id = ${userId}
        AND (
          ${tag}::text IS NULL
          OR EXISTS (
            SELECT 1
            FROM marks_bookmark_tags bt
            JOIN marks_tags t ON t.id = bt.tag_id AND t.user_id = ${userId}
            WHERE bt.bookmark_id = b.id AND bt.user_id = ${userId} AND t.name = ${tag}
          )
        )
      ORDER BY b.created_at DESC
      LIMIT 200
    )
    SELECT
      coalesce((SELECT json_agg(json_build_object('id', id, 'url', url, 'title', title, 'tags', tags, 'createdAt', created_at) ORDER BY created_at DESC) FROM visible), '[]'::json) AS bookmarks,
      coalesce((SELECT json_agg(name ORDER BY name) FROM marks_tags WHERE user_id = ${userId}), '[]'::json) AS tags
  `;
  const row = rows[0];
  return {
    bookmarks: asArray<Bookmark>(row?.bookmarks).map((bookmark) => ({
      id: String(bookmark.id),
      url: String(bookmark.url),
      title: String(bookmark.title),
      tags: Array.isArray(bookmark.tags) ? bookmark.tags.map(String) : [],
      createdAt: bookmark.createdAt ? new Date(String(bookmark.createdAt)).toISOString() : undefined,
    })),
    tags: asArray<string>(row?.tags).map(String),
  };
});

export async function insertBookmark(userId: string, url: string, title: string, tags: string[]): Promise<boolean> {
  const sql = await db();
  const id = crypto.randomUUID();
  const rows = await sql`
    WITH bookmark AS (
      INSERT INTO marks_bookmarks (id, user_id, url, title)
      SELECT ${id}, ${userId}, ${url}, ${title}
      WHERE (SELECT count(*) FROM marks_bookmarks WHERE user_id = ${userId}) < 200
      RETURNING id
    ),
    ins AS (
      INSERT INTO marks_tags (id, user_id, name)
      SELECT gen_random_uuid()::text, ${userId}, btrim(name)
      FROM unnest(string_to_array(${tags.join(",")}, ',')) AS name
      WHERE btrim(name) <> '' AND EXISTS (SELECT 1 FROM bookmark)
      ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    ),
    linked AS (
      INSERT INTO marks_bookmark_tags (bookmark_id, tag_id, user_id)
      SELECT bookmark.id, ins.id, ${userId}
      FROM bookmark
      CROSS JOIN ins
      ON CONFLICT DO NOTHING
      RETURNING bookmark_id
    )
    SELECT (SELECT count(*)::int FROM bookmark) AS inserted
  `;
  return Number(rows[0]?.inserted ?? 0) === 1;
}

export async function updateBookmark(userId: string, id: string, title: string, tags: string[]): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    WITH updated AS (
      UPDATE marks_bookmarks
      SET title = ${title}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    ),
    cleared AS (
      DELETE FROM marks_bookmark_tags
      WHERE bookmark_id = ${id} AND user_id = ${userId} AND EXISTS (SELECT 1 FROM updated)
      RETURNING tag_id
    ),
    ins AS (
      INSERT INTO marks_tags (id, user_id, name)
      SELECT gen_random_uuid()::text, ${userId}, btrim(name)
      FROM unnest(string_to_array(${tags.join(",")}, ',')) AS name
      WHERE btrim(name) <> '' AND EXISTS (SELECT 1 FROM updated)
      ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    ),
    linked AS (
      INSERT INTO marks_bookmark_tags (bookmark_id, tag_id, user_id)
      SELECT updated.id, ins.id, ${userId}
      FROM updated
      CROSS JOIN ins
      ON CONFLICT DO NOTHING
      RETURNING bookmark_id
    ),
    orphans AS (
      DELETE FROM marks_tags t
      WHERE t.user_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM marks_bookmark_tags bt WHERE bt.tag_id = t.id AND bt.user_id = ${userId}
        )
      RETURNING t.id
    )
    SELECT (SELECT count(*)::int FROM updated) AS updated
  `;
  return Number(rows[0]?.updated ?? 0) === 1;
}

export async function deleteBookmark(userId: string, id: string): Promise<void> {
  const sql = await db();
  await sql`
    WITH deleted AS (
      DELETE FROM marks_bookmarks WHERE id = ${id} AND user_id = ${userId} RETURNING id
    )
    DELETE FROM marks_tags t
    WHERE t.user_id = ${userId}
      AND NOT EXISTS (
        SELECT 1 FROM marks_bookmark_tags bt WHERE bt.tag_id = t.id AND bt.user_id = ${userId}
      )
  `;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}
