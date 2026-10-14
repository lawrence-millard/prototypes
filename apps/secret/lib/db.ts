import 'server-only'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { schemaStatements } from './queries'
import type { Queryable } from './types'

type Sql = NeonQueryFunction<false, false>

let client: Sql | undefined
let ready: Promise<void> | undefined

function sql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  if (!client) client = neon(url, { fetchOptions: { cache: 'no-store' } })
  return client
}

function schema(connection: Sql) {
  if (!ready) {
    ready = connection.transaction(schemaStatements.map((text) => connection.query(text))).then(() => undefined).catch((error: unknown) => {
      ready = undefined
      throw error
    })
  }
  return ready
}

export function getDb(): Queryable {
  return {
    async query<T>(text: string, values: readonly unknown[] = []) {
      const connection = sql()
      await schema(connection)
      const rows = await connection.query(text, [...values])
      return rows as T[]
    },
    async batch(queries) {
      const connection = sql()
      await schema(connection)
      const rows = await connection.transaction(queries.map((query) => connection.query(query.text, query.values ? [...query.values] : [])))
      return rows as unknown[][]
    },
  }
}
