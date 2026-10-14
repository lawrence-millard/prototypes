export type Queryable = {
  query<T>(text: string, values?: readonly unknown[]): Promise<T[]>
  batch(queries: { text: string; values?: readonly unknown[] }[]): Promise<unknown[][]>
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export type Deck = {
  id: string
  name: string
  cards: number
  due: number
}

export type Card = {
  id: string
  front: string
  back: string
  ease: number
  intervalDays: number
  repetitions: number
  dueAt: string
  createdAt: string
}

export type DeckDetail = {
  id: string
  name: string
  cards: Card[]
}

export type Grade = 'again' | 'good' | 'easy'
