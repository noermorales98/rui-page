import { z } from 'zod'
import { fieldConfigSchema } from '@/lib/forms/conditional'

export const formStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export const formFieldTypeSchema = z.enum([
  'SHORT_TEXT',
  'FULL_NAME',
  'PHONE',
  'PHONE_WITH_COUNTRY',
  'EMAIL',
  'CUSTOM_DATE',
  'CUSTOM_TIME',
  'CUSTOM_DATETIME',
])

export const contactTargetSchema = z.enum(['NONE', 'NAME', 'EMAIL', 'PHONE'])

export const createFormSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(191),
  slug: z
    .string()
    .trim()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(191)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Slug: solo minúsculas, números y guiones'),
  description: z.string().trim().max(2000).optional().nullable(),
  submitLabel: z.string().trim().min(1).max(80).default('Enviar'),
  successMessage: z.string().trim().min(1).max(500).default('Gracias, recibimos tus datos.'),
})
export type CreateFormInput = z.infer<typeof createFormSchema>

export const updateFormSchema = createFormSchema.partial()
export type UpdateFormInput = z.infer<typeof updateFormSchema>

export const createFieldSchema = z.object({
  type: formFieldTypeSchema,
  label: z.string().trim().min(1, 'La etiqueta es obligatoria').max(191),
  fieldKey: z.string().trim().min(1).max(191).regex(/^[a-z0-9_]+$/),
  placeholder: z.string().trim().max(191).optional().nullable(),
  helpText: z.string().trim().max(500).optional().nullable(),
  isRequired: z.boolean().default(false),
  contactTarget: contactTargetSchema.default('NONE'),
  config: fieldConfigSchema.optional().nullable(),
})
export type CreateFieldInput = z.infer<typeof createFieldSchema>

export const updateFieldSchema = createFieldSchema.partial()
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>

export const reorderFieldsSchema = z.object({
  orderedFieldIds: z.array(z.coerce.number().int().positive()).min(1),
})
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>
