import { z } from 'zod'
import {
  MAX_CONNECTORS,
  MAX_COORD,
  MAX_NAME,
  MAX_SHAPE,
  MAX_SHAPES,
  MAX_TEXT,
  MIN_COORD,
  MIN_SHAPE,
} from '../model/constants.js'

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/)
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)

export const shapeSchema = z
  .object({
    id: idSchema,
    kind: z.enum(['rectangle', 'ellipse', 'diamond', 'text']),
    x: z.number().finite().min(MIN_COORD).max(MAX_COORD),
    y: z.number().finite().min(MIN_COORD).max(MAX_COORD),
    width: z.number().finite().min(MIN_SHAPE).max(MAX_SHAPE),
    height: z.number().finite().min(MIN_SHAPE).max(MAX_SHAPE),
    text: z.string().max(MAX_TEXT),
    fill: colorSchema,
    stroke: colorSchema,
  })
  .strict()

export const connectorSchema = z
  .object({
    id: idSchema,
    fromId: idSchema,
    toId: idSchema,
  })
  .strict()

export const changeSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(MAX_NAME),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    deleted: z.boolean().optional(),
    sample: z.boolean().optional(),
    shapes: z.array(shapeSchema).max(MAX_SHAPES).optional(),
    connectors: z.array(connectorSchema).max(MAX_CONNECTORS).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.deleted) return
    if (!value.shapes || !value.connectors) {
      ctx.addIssue({ code: 'custom', message: 'invalid' })
      return
    }
    const ids = new Set(value.shapes.map((shape) => shape.id))
    if (ids.size !== value.shapes.length) ctx.addIssue({ code: 'custom', message: 'invalid' })
    for (const connector of value.connectors) {
      if (connector.fromId === connector.toId || !ids.has(connector.fromId) || !ids.has(connector.toId)) {
        ctx.addIssue({ code: 'custom', message: 'invalid' })
      }
    }
  })

export const pushSchema = z
  .object({
    changes: z.array(changeSchema).max(25),
  })
  .strict()

export const remoteBoardSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1).max(MAX_NAME),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    deletedAt: z.number().int().nonnegative().nullable(),
    sample: z.boolean(),
    shapes: z.array(shapeSchema).max(MAX_SHAPES),
    connectors: z.array(connectorSchema).max(MAX_CONNECTORS),
  })
  .strict()

export const remoteResponseSchema = z
  .object({
    boards: z.array(remoteBoardSchema).max(200),
  })
  .strict()

export type PushChange = z.infer<typeof changeSchema>
export type RemoteBoard = z.infer<typeof remoteBoardSchema>
