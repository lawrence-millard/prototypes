import "server-only";

import { brand } from "@/lib/brand";
import { db } from "@/lib/db";

const TABLES = {
  marks: "marks_rate_limits",
  status: "status_rate_limits",
  poll: "poll_rate_limits",
  split: "split_rate_limits",
} as const;

const WINDOW_SEC = 60;

export async function allowBucket(userId: string, name: "write" | "check", limit: number): Promise<boolean> {
  const table = TABLES[brand.name as keyof typeof TABLES];
  if (!table) return false;
  const sql = await db();
  const rows = await sql.query(
    `INSERT INTO ${table} (bucket, hits, window_start)
     VALUES ($1, 1, now())
     ON CONFLICT (bucket) DO UPDATE SET
       hits = CASE
         WHEN ${table}.window_start <= now() - make_interval(secs => $2) THEN 1
         ELSE ${table}.hits + 1
       END,
       window_start = CASE
         WHEN ${table}.window_start <= now() - make_interval(secs => $2) THEN now()
         ELSE ${table}.window_start
       END
     RETURNING hits`,
    [`${name}:${userId}`, WINDOW_SEC],
  );
  return Number(rows[0]?.hits ?? 0) <= limit;
}
