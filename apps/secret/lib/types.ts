export type Queryable = {
  query<T>(text: string, values?: readonly unknown[]): Promise<T[]>
  batch(queries: { text: string; values?: readonly unknown[] }[]): Promise<unknown[][]>
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export type SecretItem = {
  id: string
  expiresAt: string
  createdAt: string
}
