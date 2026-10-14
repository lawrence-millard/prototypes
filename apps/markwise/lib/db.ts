import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "@/lib/schema";
import { users } from "@/lib/schema";
import { SCHEMA_SQL } from "@/lib/schema-sql";
import { DEMO_USER_ID } from "@/lib/subjects";
import { seedCatalog, seedDemo } from "@/lib/seed";

export type Database = PgliteDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  markwiseDb?: Database;
  markwiseReady?: Promise<void>;
};

export async function getDb() {
  if (!globalForDb.markwiseReady) {
    globalForDb.markwiseReady = init().catch((error) => {
      globalForDb.markwiseReady = undefined;
      throw error;
    });
  }
  await globalForDb.markwiseReady;
  return globalForDb.markwiseDb!;
}

async function init() {
  if (process.env.DATABASE_URL) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const sql = neon(process.env.DATABASE_URL);
    for (const statement of splitSql(SCHEMA_SQL)) {
      await sql.query(statement);
    }
    globalForDb.markwiseDb = drizzle({ client: sql, schema }) as unknown as Database;
  } else if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is required");
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dir = process.env.VERCEL ? "/tmp/markwise-pglite" : path.join(process.cwd(), ".data", "pglite");
    mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    await client.exec(SCHEMA_SQL);
    globalForDb.markwiseDb = drizzle({ client, schema });
  }

  const db = globalForDb.markwiseDb!;
  await seedCatalog(db);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, DEMO_USER_ID));
  if (existing.length === 0) await seedDemo(db);
}

function splitSql(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}
