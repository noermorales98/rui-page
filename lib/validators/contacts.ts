import { z } from 'zod'

const contactStatusSchema = z.enum(['NEW', 'QUALIFIED', 'CLIENT'])
const contactSourceSchema = z.enum(['WEBINAR', 'FORM', 'MANUAL', 'IMPORT'])

export const createContactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  email: z.string().email('Correo electrónico inválido'),
  phone: z
    .preprocess((val) => {
      if (val === null || val === undefined) return undefined
      const s = String(val).trim()
      return s === '' ? undefined : s
    }, z.string().min(7, 'El teléfono debe tener al menos 7 caracteres').max(20).optional()),
  source: contactSourceSchema.default('MANUAL'),
  status: contactStatusSchema.default('NEW'),
})

export const updateContactSchema = createContactSchema.partial()

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>

/** Valores válidos de estado (para filtrar entradas de URL). */
const CONTACT_STATUS_VALUES = contactStatusSchema.options
/** Valores válidos de fuente. */
const CONTACT_SOURCE_VALUES = contactSourceSchema.options

function toMultiString(val: unknown): string[] {
  if (val == null || val === '') return []
  const parts = (Array.isArray(val) ? val : String(val).split(','))
    .flatMap((p) => String(p).trim())
    .filter(Boolean)
  return parts
}

function parseStatusFilters(val: unknown): z.infer<typeof contactStatusSchema>[] {
  return toMultiString(val).filter((s): s is z.infer<typeof contactStatusSchema> =>
    (CONTACT_STATUS_VALUES as readonly string[]).includes(s),
  )
}

function parseSourceFilters(val: unknown): z.infer<typeof contactSourceSchema>[] {
  return toMultiString(val).filter((s): s is z.infer<typeof contactSourceSchema> =>
    (CONTACT_SOURCE_VALUES as readonly string[]).includes(s),
  )
}

/**
 * Filtros del listado de contactos (p. ej. desde `searchParams`).
 * Acepta `status` / `source` repetidos o separados por coma; `q` o `search` para texto.
 */
export const listContactsFiltersSchema = z.preprocess(
  (raw) => {
    const o = (raw ?? {}) as Record<string, unknown>
    const search =
      (typeof o.q === 'string' && o.q) ||
      (typeof o.search === 'string' && o.search) ||
      ''
    const tagRaw = o.tag
    let tagId: number | undefined
    if (tagRaw !== undefined && tagRaw !== null && tagRaw !== '') {
      const n = Number(tagRaw)
      if (Number.isInteger(n) && n > 0) tagId = n
    }
    return {
      search: String(search).trim(),
      status: parseStatusFilters(o.status),
      source: parseSourceFilters(o.source),
      page: o.page,
      take: o.take,
      tagId,
    }
  },
  z.object({
    search: z.string().max(200).default(''),
    status: z.array(contactStatusSchema).default([]),
    source: z.array(contactSourceSchema).default([]),
    page: z.coerce.number().int().min(1).default(1),
    take: z.coerce.number().int().min(1).max(100).default(25),
    tagId: z.number().int().positive().optional(),
  }),
)

export type ListContactsFiltersInput = z.infer<typeof listContactsFiltersSchema>

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Normaliza claves de fila CSV (ES/EN) a: name, email, phone?, source?
 */
export function normalizeImportContactRowKeys(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const aliasToCanonical: Record<string, string> = {
    name: 'name',
    nombre: 'name',
    email: 'email',
    correo: 'email',
    'e-mail': 'email',
    phone: 'phone',
    telefono: 'phone',
    teléfono: 'phone',
    movil: 'phone',
    móvil: 'phone',
    celular: 'phone',
    source: 'source',
    fuente: 'source',
  }

  const out: Record<string, unknown> = {}
  for (const [rawKey, value] of Object.entries(row)) {
    const k = stripAccents(rawKey.toLowerCase().trim())
    const canonical = aliasToCanonical[k]
    if (canonical) {
      out[canonical] = value
    }
  }
  return out
}

const importContactRowInnerSchema = z.object({
  name: z.string().min(1, 'Nombre obligatorio').max(120),
  email: z.string().email('Correo inválido'),
  phone: z
    .preprocess((val) => {
      if (val === null || val === undefined) return undefined
      const s = String(val).trim()
      return s === '' ? undefined : s
    }, z.string().min(7, 'Teléfono inválido').max(20).optional()),
  source: contactSourceSchema.default('IMPORT'),
})

/**
 * Fila de import CSV: acepta columnas en ES/EN vía `normalizeImportContactRowKeys`
 * antes de `safeParse`, o pasa un objeto ya canónico.
 */
export const importContactRowSchema = z.preprocess(
  (row) => {
    if (row === null || typeof row !== 'object') return row
    return normalizeImportContactRowKeys(row as Record<string, unknown>)
  },
  importContactRowInnerSchema,
)

export type ImportContactRowInput = z.infer<typeof importContactRowSchema>
