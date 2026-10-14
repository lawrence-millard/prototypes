import { z } from 'zod'

const lengths = { focus: 1500, short: 300, long: 900 } as const

export const idSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

const labelSchema = z.string().transform((value) => value.trim().replace(/\s+/g, ' ')).pipe(z.string().max(80))

export const createSchema = z.object({
  id: idSchema,
  kind: z.enum(['focus', 'short', 'long']),
  seconds: z.number().int(),
  label: labelSchema,
}).refine((data) => data.seconds === lengths[data.kind])

export const updateSchema = z.object({
  id: idSchema,
  label: labelSchema,
})

export const deleteSchema = z.object({
  id: idSchema,
})
