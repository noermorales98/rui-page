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
  'HTML_INPUT',
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

/** Objeto base (sin refinements): permite `.partial()` para updates. */
export const createFieldObjectSchema = z.object({
  type: formFieldTypeSchema,
  label: z.string().trim().min(1, 'La etiqueta es obligatoria').max(191),
  fieldKey: z.string().trim().min(1).max(191).regex(/^[a-z0-9_]+$/),
  placeholder: z.string().trim().max(191).optional().nullable(),
  helpText: z.string().trim().max(500).optional().nullable(),
  isRequired: z.boolean().default(false),
  contactTarget: contactTargetSchema.default('NONE'),
  config: fieldConfigSchema.optional().nullable(),
})

function refineHtmlFieldConfig(data: { type?: unknown; config?: unknown }, ctx: z.RefinementCtx) {
  if (data.type !== 'HTML_INPUT') return
  const cfg = fieldConfigSchema.safeParse(data.config ?? {})
  if (!cfg.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Configuración de campo inválida',
      path: ['config'],
    })
    return
  }
  if (!cfg.data.html) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Los campos HTML requieren config.html (elemento, tipo, etc.)',
      path: ['config'],
    })
  }
}

export const createFieldSchema = createFieldObjectSchema.superRefine(refineHtmlFieldConfig)
export type CreateFieldInput = z.infer<typeof createFieldSchema>

/** Parcial sobre el objeto base; valida `config.html` solo cuando `type === HTML_INPUT` y viene `config`. */
export const updateFieldSchema = createFieldObjectSchema.partial().superRefine((data, ctx) => {
  if (data.type !== 'HTML_INPUT') return
  if (data.config === undefined) return
  refineHtmlFieldConfig({ type: 'HTML_INPUT', config: data.config }, ctx)
})
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>

export const reorderFieldsSchema = z.object({
  orderedFieldIds: z.array(z.coerce.number().int().positive()).min(1),
})
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>
