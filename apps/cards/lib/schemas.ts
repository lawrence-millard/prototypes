import { z } from 'zod'

export const idSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

const nameSchema = z.string().transform((value) => value.trim().replace(/\s+/g, ' ')).pipe(z.string().min(1).max(80))
const sideSchema = z.string().transform((value) => value.trim()).pipe(z.string().min(1).max(2000))

export const createDeckSchema = z.object({ id: idSchema, name: nameSchema })
export const renameDeckSchema = z.object({ id: idSchema, name: nameSchema })
export const deleteDeckSchema = z.object({ id: idSchema })
export const createCardSchema = z.object({ id: idSchema, deckId: idSchema, front: sideSchema, back: sideSchema })
export const updateCardSchema = z.object({ id: idSchema, front: sideSchema, back: sideSchema })
export const deleteCardSchema = z.object({ id: idSchema })
export const reviewSchema = z.object({ id: idSchema, grade: z.enum(['again', 'good', 'easy']) })
