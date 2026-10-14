import { z } from 'zod'

export const idSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

const titleSchema = z.string().transform((value) => value.trim().replace(/\s+/g, ' ')).pipe(z.string().min(1).max(120))
const noteSchema = z.string().transform((value) => value.trim()).pipe(z.string().max(500))
const whenSchema = z.string().refine((value) => {
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return false
  const years = Math.abs(time - Date.now()) / (365.25 * 24 * 3600 * 1000)
  return years <= 100
})

export const createSchema = z.object({ title: titleSchema, note: noteSchema, happensAt: whenSchema })
export const updateSchema = z.object({ id: idSchema, title: titleSchema, note: noteSchema, happensAt: whenSchema })
export const deleteSchema = z.object({ id: idSchema })
export const slugSchema = z.string().regex(/^[A-Za-z0-9_-]{8,32}$/)
