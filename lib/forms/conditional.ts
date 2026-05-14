import { z } from 'zod'
import { htmlFieldSettingsSchema } from '@/lib/forms/html-field'

export const conditionalOpSchema = z.enum(['eq', 'neq', 'in', 'notIn', 'empty', 'notEmpty'])
export type ConditionalOp = z.infer<typeof conditionalOpSchema>

export const conditionalShowWhenSchema = z.object({
  fieldKey: z.string().min(1),
  op: conditionalOpSchema,
  value: z.union([z.string(), z.array(z.string())]).optional(),
})
export type ConditionalShowWhen = z.infer<typeof conditionalShowWhenSchema>

export const fieldConfigSchema = z
  .object({
    showWhen: conditionalShowWhenSchema.optional(),
    html: htmlFieldSettingsSchema.optional(),
  })
  .partial()
export type FieldConfig = z.infer<typeof fieldConfigSchema>

/**
 * Parse `CrmFormField.config` (Prisma Json) into a typed object, returning
 * `null` if it's empty or malformed. Used by both the builder and the
 * public renderer so they always agree on the shape.
 */
export function parseFieldConfig(raw: unknown): FieldConfig | null {
  if (raw == null) return null
  const parsed = fieldConfigSchema.safeParse(raw)
  if (!parsed.success) return null
  return parsed.data
}

/**
 * Decide whether a field should be visible given the current form values.
 * Returns `true` when:
 *   - the field has no `showWhen` rule, or
 *   - the rule evaluates to true against the supplied values.
 *
 * The same function runs in the browser (live preview + public renderer)
 * and on the server (submit validation) — keep it pure and side-effect free.
 */
export function shouldShowField(
  field: { config?: unknown },
  values: Record<string, string | undefined>,
): boolean {
  const cfg = parseFieldConfig(field.config)
  const cond = cfg?.showWhen
  if (!cond) return true

  const sourceValue = values[cond.fieldKey]
  const cmp = cond.value

  switch (cond.op) {
    case 'eq':
      return typeof cmp === 'string' && sourceValue === cmp
    case 'neq':
      return typeof cmp === 'string' && sourceValue !== cmp
    case 'in':
      return Array.isArray(cmp) && typeof sourceValue === 'string' && cmp.includes(sourceValue)
    case 'notIn':
      return Array.isArray(cmp) && (typeof sourceValue !== 'string' || !cmp.includes(sourceValue))
    case 'empty':
      return sourceValue === undefined || sourceValue === ''
    case 'notEmpty':
      return typeof sourceValue === 'string' && sourceValue !== ''
    default:
      return true
  }
}
