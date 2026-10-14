import { PGlite } from '@electric-sql/pglite'

export async function createDb() {
  const db = new PGlite()
  return {
    async query<T>(text: string, values: readonly unknown[] = []) {
      const result = await db.query(text, [...values])
      return result.rows as T[]
    },
    async batch(queries: { text: string; values?: readonly unknown[] }[]) {
      const out: unknown[][] = []
      await db.transaction(async (tx) => {
        for (const query of queries) {
          const result = await tx.query(query.text, query.values ? [...query.values] : [])
          out.push(result.rows)
        }
      })
      return out
    },
    close: () => db.close(),
  }
}
