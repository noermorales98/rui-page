import { z } from 'zod'

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal #RRGGBB')

export const createTagSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(80),
  color: hexColorSchema.optional().default('#6366f1'),
})

export const updateTagSchema = createTagSchema.partial()

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
