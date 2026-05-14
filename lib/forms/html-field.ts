import { z } from 'zod'

/** Subconjunto de tipos `input` HTML5 soportados en el CRM. */
export const htmlNativeInputTypeSchema = z.enum([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
  'range',
  'color',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
  'file',
  'hidden',
  'checkbox',
  'radio',
])

export type HtmlNativeInputType = z.infer<typeof htmlNativeInputTypeSchema>

/** Lista para selects en el builder. */
export const HTML_NATIVE_INPUT_TYPE_LIST: readonly HtmlNativeInputType[] = htmlNativeInputTypeSchema.options

export const htmlFieldSettingsSchema = z
  .object({
    element: z.enum(['input', 'textarea', 'select']).default('input'),
    inputType: htmlNativeInputTypeSchema.optional(),
    rows: z.number().int().min(1).max(50).optional(),
    /** Opciones para `select` o `radio`; una línea por opción en el builder. */
    options: z.array(z.string().min(1).max(191)).max(100).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.union([z.string().max(32), z.number()]).optional(),
    minLength: z.number().int().min(0).max(10000).optional(),
    maxLength: z.number().int().min(1).max(10000).optional(),
    pattern: z.string().max(500).optional(),
    accept: z.string().max(300).optional(),
    multiple: z.boolean().optional(),
    autocomplete: z.string().max(100).optional(),
    /** Valor inicial para `input type=hidden` (solo lectura en el envío). */
    defaultValue: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.element === 'select') {
      if (!data.options?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Agrega al menos una opción para la lista.',
          path: ['options'],
        })
      }
      return
    }
    if (data.element === 'textarea') return

    const t = data.inputType ?? 'text'
    if (t === 'radio' && (!data.options || data.options.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Radio: agrega al menos dos opciones.',
        path: ['options'],
      })
    }
  })

export type HtmlFieldSettings = z.infer<typeof htmlFieldSettingsSchema>

export function parseHtmlFieldSettings(raw: unknown): HtmlFieldSettings | null {
  const parsed = htmlFieldSettingsSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

/** Combina `config.html` con valores por defecto seguros para render/validación. */
export function mergeHtmlFieldSettings(config: unknown): HtmlFieldSettings {
  let raw: unknown
  if (config && typeof config === 'object' && 'html' in config) {
    raw = (config as { html: unknown }).html
  } else {
    raw = undefined
  }
  const parsed = htmlFieldSettingsSchema.safeParse({
    element: 'input',
    inputType: 'text',
    ...(typeof raw === 'object' && raw !== null ? raw : {}),
  })
  return parsed.success ? parsed.data : { element: 'input', inputType: 'text' }
}

function validUrlLoose(s: string): boolean {
  try {
    const u = new URL(/\w+:\/\//.test(s) ? s : `https://${s}`)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateHtmlControl(html: HtmlFieldSettings, rawValue: string, isRequired: boolean): string | null {
  const value = rawValue.trim()
  const el = html.element
  const inputType = html.inputType ?? 'text'

  if (el === 'textarea') {
    if (isRequired && !value) return 'Este campo es obligatorio'
    if (html.minLength != null && value.length < html.minLength) {
      return `Mínimo ${html.minLength} caracteres`
    }
    if (html.maxLength != null && value.length > html.maxLength) {
      return `Máximo ${html.maxLength} caracteres`
    }
    if (html.pattern && value) {
      try {
        if (!new RegExp(html.pattern).test(value)) return 'El formato no es válido'
      } catch {
        return 'Patrón de validación inválido'
      }
    }
    return null
  }

  if (el === 'select') {
    const opts = html.options ?? []
    if (isRequired && !value) return 'Este campo es obligatorio'
    if (!value) return null
    const parts = html.multiple ? value.split(',').map((s) => s.trim()).filter(Boolean) : [value]
    for (const p of parts) {
      if (!opts.includes(p)) return 'Opción no válida'
    }
    return null
  }

  // input
  if (inputType === 'checkbox') {
    const on = rawValue === 'on' || rawValue === 'true' || rawValue === '1'
    if (isRequired && !on) return 'Este campo es obligatorio'
    return null
  }

  if (inputType === 'radio') {
    const opts = html.options ?? []
    if (isRequired && !value) return 'Este campo es obligatorio'
    if (value && !opts.includes(value)) return 'Opción no válida'
    return null
  }

  if (inputType === 'hidden') {
    if (isRequired && !value) return 'Este campo es obligatorio'
    if (html.pattern && value) {
      try {
        if (!new RegExp(html.pattern).test(value)) return 'El formato no es válido'
      } catch {
        return 'Patrón de validación inválido'
      }
    }
    return null
  }

  if (isRequired && !value) return 'Este campo es obligatorio'
  if (!value) return null

  if (inputType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Correo inválido'
  }
  if (inputType === 'url' && !validUrlLoose(value)) return 'URL inválida'
  if (inputType === 'tel' && value.replace(/[^\d+]/g, '').length < 7) return 'Teléfono inválido'

  if (inputType === 'number' || inputType === 'range') {
    const n = Number(value)
    if (!Number.isFinite(n)) return 'Número inválido'
    if (html.min != null && n < html.min) return `Valor mínimo: ${html.min}`
    if (html.max != null && n > html.max) return `Valor máximo: ${html.max}`
  }

  if (inputType === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Fecha inválida'
  if (inputType === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return 'Hora inválida'
  if (inputType === 'datetime-local' && !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return 'Fecha y hora inválida'
  }
  if (inputType === 'month' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return 'Mes inválido'
  if (inputType === 'week' && !/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(value)) return 'Semana inválida'
  if (inputType === 'color' && !/^#[0-9a-fA-F]{6}$/.test(value)) return 'Color inválido'

  if (inputType === 'file') {
    if (value.length > 512) return 'Nombre de archivo demasiado largo'
    return null
  }

  if (html.minLength != null && value.length < html.minLength) {
    return `Mínimo ${html.minLength} caracteres`
  }
  if (html.maxLength != null && value.length > html.maxLength) {
    return `Máximo ${html.maxLength} caracteres`
  }
  if (html.pattern) {
    try {
      if (!new RegExp(html.pattern).test(value)) return 'El formato no es válido'
    } catch {
      return 'Patrón de validación inválido'
    }
  }

  return null
}

export function normalizeHtmlControl(html: HtmlFieldSettings, rawValue: string): string {
  const v = rawValue.trim()
  const el = html.element
  const inputType = html.inputType ?? 'text'

  if (el === 'select' && html.multiple) {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ')
  }

  if (el !== 'input') return v.slice(0, 10000)

  if (inputType === 'email') return v.toLowerCase().slice(0, 191)
  if (inputType === 'tel') return v.replace(/[^\d+]/g, '').slice(0, 191)
  if (inputType === 'checkbox') return v === 'on' || v === 'true' || v === '1' ? 'true' : ''
  if (inputType === 'number' || inputType === 'range') {
    const n = Number(v)
    return Number.isFinite(n) ? String(n) : ''
  }
  if (inputType === 'file') return v.slice(0, 512)

  return v.slice(0, 10000)
}
