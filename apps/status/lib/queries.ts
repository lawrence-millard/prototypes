import "server-only";

import { cache } from "react";
import { PREVIEW_USER_ID, previewOn } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Monitor } from "@/lib/list-state";
import { previewMonitors } from "@/lib/preview";
import { probe } from "@/lib/probe";
import { allowBucket } from "@/lib/rate-limit";

const STALE_MS = 20_000;

export const loadMonitors = cache(async (userId: string, force = false): Promise<{ items: Monitor[]; limited: boolean }> => {
  if (previewOn() && userId === PREVIEW_USER_ID) return previewMonitors();
  const sql = await db();
  const rows = await sql`
    SELECT m.id, m.url, m.label, c.ok, c.status_code, c.latency_ms, c.error, c.checked_at
    FROM status_monitors m
    LEFT JOIN LATERAL (
      SELECT ok, status_code, latency_ms, error, checked_at
      FROM status_checks
      WHERE monitor_id = m.id AND user_id = m.user_id
      ORDER BY checked_at DESC
      LIMIT 1
    ) c ON true
    WHERE m.user_id = ${userId}
    ORDER BY m.created_at DESC
    LIMIT 12
  `;
  const items = rows.map(toMonitor);
  const now = Date.now();
  const due = force ? items : items.filter((item) => !item.checkedAt || now - item.checkedAt > STALE_MS);
  if (!due.length) return { items, limited: false };
  if (!(await allowBucket(userId, "check", 12))) return { items, limited: true };
  const results = await mapPool(due, 4, (item) => probe(item.url));
  await insertChecks(
    userId,
    due.map((item, index) => ({ monitorId: item.id, result: results[index] })),
  );
  const byId = new Map(due.map((item, index) => [item.id, results[index]]));
  return {
    limited: false,
    items: items.map((item) => {
      const result = byId.get(item.id);
      if (!result) return item;
      return {
        ...item,
        ok: result.ok,
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
        error: result.error,
      };
    }),
  };
});

export async function insertMonitor(userId: string, url: string, label: string): Promise<"ok" | "limit" | "exists"> {
  const sql = await db();
  const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO status_monitors (id, user_id, url, label)
    SELECT ${id}, ${userId}, ${url}, ${label}
    WHERE (SELECT count(*) FROM status_monitors WHERE user_id = ${userId}) < 12
    ON CONFLICT (user_id, url) DO NOTHING
    RETURNING id
  `;
  if (rows.length === 1) return "ok";
  const existing = await sql`SELECT 1 FROM status_monitors WHERE user_id = ${userId} AND url = ${url}`;
  return existing.length ? "exists" : "limit";
}

export async function updateLabel(userId: string, id: string, label: string): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    UPDATE status_monitors SET label = ${label}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length === 1;
}

export async function deleteMonitor(userId: string, id: string): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM status_monitors WHERE id = ${id} AND user_id = ${userId}`;
}

async function insertChecks(userId: string, rows: { monitorId: string; result: Awaited<ReturnType<typeof probe>> }[]) {
  if (!rows.length) return;
  const sql = await db();
  const values: unknown[] = [];
  const chunks = rows.map((row, index) => {
    const base = index * 7;
    values.push(crypto.randomUUID(), row.monitorId, userId, row.result.ok, row.result.statusCode, row.result.latencyMs, row.result.error);
    return `($${base + 1}::text, $${base + 2}::text, $${base + 3}::text, $${base + 4}::boolean, $${base + 5}::int, $${base + 6}::int, $${base + 7}::text)`;
  });
  values.push(userId);
  const userParam = values.length;
  await sql.query(
    `WITH ins AS (
       INSERT INTO status_checks (id, monitor_id, user_id, ok, status_code, latency_ms, error)
       SELECT v.id, m.id, v.user_id, v.ok, v.status_code, v.latency_ms, NULLIF(v.error, '')
       FROM (VALUES ${chunks.join(",")}) AS v(id, monitor_id, user_id, ok, status_code, latency_ms, error)
       JOIN status_monitors m ON m.id = v.monitor_id AND m.user_id = v.user_id
       RETURNING monitor_id
     ),
     ranked AS (
       SELECT id, row_number() OVER (PARTITION BY monitor_id ORDER BY checked_at DESC) AS n
       FROM status_checks
       WHERE user_id = $${userParam}
         AND monitor_id IN (SELECT monitor_id FROM ins)
     )
     DELETE FROM status_checks WHERE id IN (SELECT id FROM ranked WHERE n > 20)`,
    values,
  );
}

function toMonitor(row: Record<string, unknown>): Monitor & { checkedAt: number | null } {
  const checked = row.checked_at ? new Date(String(row.checked_at)).getTime() : null;
  return {
    id: String(row.id),
    url: String(row.url),
    label: String(row.label),
    ok: row.ok === null || row.ok === undefined ? null : Boolean(row.ok),
    statusCode: row.status_code === null || row.status_code === undefined ? null : Number(row.status_code),
    latencyMs: row.latency_ms === null || row.latency_ms === undefined ? null : Number(row.latency_ms),
    error: row.error ? String(row.error) : null,
    at: checked && !Number.isNaN(checked) ? new Date(checked).toISOString() : undefined,
    checkedAt: Number.isNaN(checked) ? null : checked,
  };
}

async function mapPool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}
