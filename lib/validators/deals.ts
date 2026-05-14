import { z } from 'zod'

export const dealStageSchema = z.enum(['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED'])

export const createDealSchema = z.object({
  contactId: z.coerce.number().int().positive('Selecciona un contacto'),
  courseName: z.string().trim().max(191).optional().nullable(),
  stage: dealStageSchema.default('LEAD'),
  notes: z.string().trim().max(5000).optional().nullable(),
})
export type CreateDealInput = z.infer<typeof createDealSchema>

export const updateDealSchema = createDealSchema.omit({ contactId: true }).partial()
export type UpdateDealInput = z.infer<typeof updateDealSchema>

export const moveDealSchema = z.object({
  toStage: dealStageSchema,
})
export type MoveDealInput = z.infer<typeof moveDealSchema>
