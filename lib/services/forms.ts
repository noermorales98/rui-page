'use server'

import { createHash } from 'node:crypto'
import { Prisma, type CrmFormFieldType, type Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { mapError, type ApiError } from '@/lib/errors/map'
import {
  normalizeValue,
  validateFieldValue,
} from '@/app/crm/formularios/_lib/field-types'
import { shouldShowField } from '@/lib/forms/conditional'
import {
  createFieldSchema,
  createFormSchema,
  formStatusSchema,
  reorderFieldsSchema,
  updateFieldSchema,
  updateFormSchema,
} from '@/lib/validators/forms'

const ALL_ROLES: Role[] = ['ADMIN', 'VENDEDOR', 'ASISTENTE']
const NON_ASISTENTE: Role[] = ['ADMIN', 'VENDEDOR']
const ADMIN_ONLY: Role[] = ['ADMIN']

export type FormsServiceResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

const formListInclude = {
  _count: { select: { fields: true, submissions: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.CrmFormInclude

const formDetailInclude = {
  fields: { orderBy: { position: 'asc' as const } },
  _count: { select: { submissions: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.CrmFormInclude

export type FormListItem = Prisma.CrmFormGetPayload<{ include: typeof formListInclude }>
export type FormDetail = Prisma.CrmFormGetPayload<{ include: typeof formDetailInclude }>

function actorId(rawId: string): number | null {
  const n = Number(rawId)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function listForms(): Promise<FormsServiceResult<FormListItem[]>> {
  try {
    await requireRole(ALL_ROLES)
    const forms = await prisma.crmForm.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: formListInclude,
    })
    return { ok: true, data: forms }
  } catch (e) {
    return mapError(e)
  }
}

export async function getForm(id: unknown): Promise<FormsServiceResult<FormDetail>> {
  try {
    await requireRole(ALL_ROLES)
    const formId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(formId) || formId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const form = await prisma.crmForm.findFirst({
      where: { id: formId, deletedAt: null },
      include: formDetailInclude,
    })
    if (!form) return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }
    return { ok: true, data: form }
  } catch (e) {
    return mapError(e)
  }
}

export async function getPublishedFormBySlug(slug: string): Promise<FormsServiceResult<FormDetail>> {
  try {
    const form = await prisma.crmForm.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: formDetailInclude,
    })
    if (!form) return { ok: false, error: { code: 'NOT_FOUND', message: 'Formulario no disponible.' } }
    return { ok: true, data: form }
  } catch (e) {
    return mapError(e)
  }
}

export async function createForm(raw: unknown): Promise<FormsServiceResult<FormDetail>> {
  try {
    const session = await requireRole(ALL_ROLES)
    const parsed = createFormSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      }
    }
    const input = parsed.data

    const form = await prisma.crmForm.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        submitLabel: input.submitLabel,
        successMessage: input.successMessage,
        createdById: actorId(session.user.id),
      },
      include: formDetailInclude,
    })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: form.id,
      action: 'CREATE',
      changes: { name: form.name, slug: form.slug, status: form.status },
    })

    return { ok: true, data: form }
  } catch (e) {
    return mapError(e)
  }
}

export async function updateForm(id: unknown, raw: unknown): Promise<FormsServiceResult<FormDetail>> {
  try {
    const session = await requireRole(ALL_ROLES)
    const formId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(formId) || formId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const parsed = updateFormSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      }
    }

    const existing = await prisma.crmForm.findFirst({
      where: { id: formId, deletedAt: null },
      select: { id: true, name: true, slug: true, description: true, submitLabel: true, successMessage: true },
    })
    if (!existing) return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }

    const data: Prisma.CrmFormUpdateInput = {}
    const changes: Record<string, { from: string | null; to: string | null }> = {}
    for (const field of ['name', 'slug', 'description', 'submitLabel', 'successMessage'] as const) {
      const next = parsed.data[field]
      if (next !== undefined && next !== existing[field]) {
        if (field === 'description') data.description = next ?? null
        else data[field] = next as string
        changes[field] = { from: (existing[field] as string | null) ?? null, to: (next as string | null) ?? null }
      }
    }

    if (Object.keys(changes).length === 0) {
      const form = await prisma.crmForm.findUnique({ where: { id: formId }, include: formDetailInclude })
      return { ok: true, data: form! }
    }

    const form = await prisma.crmForm.update({
      where: { id: formId },
      data,
      include: formDetailInclude,
    })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: formId,
      action: 'UPDATE',
      changes,
    })

    return { ok: true, data: form }
  } catch (e) {
    return mapError(e)
  }
}

export async function setFormStatus(
  id: unknown,
  raw: unknown,
): Promise<FormsServiceResult<{ id: number; status: ReturnType<typeof formStatusSchema.parse> }>> {
  try {
    const session = await requireRole(NON_ASISTENTE)
    const formId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(formId) || formId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const parsed = formStatusSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Estado inválido' } }
    }
    const status = parsed.data

    const existing = await prisma.crmForm.findFirst({
      where: { id: formId, deletedAt: null },
      select: { id: true, status: true, _count: { select: { fields: true } } },
    })
    if (!existing) return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }
    if (existing.status === status) return { ok: true, data: { id: formId, status } }
    if (status === 'PUBLISHED' && existing._count.fields === 0) {
      return { ok: false, error: { code: 'CONFLICT', message: 'Agrega al menos un campo antes de publicar.' } }
    }

    await prisma.crmForm.update({ where: { id: formId }, data: { status } })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: formId,
      action: 'STATUS_CHANGE',
      changes: { status: { from: existing.status, to: status } },
    })

    return { ok: true, data: { id: formId, status } }
  } catch (e) {
    return mapError(e)
  }
}

export async function softDeleteForm(id: unknown): Promise<FormsServiceResult<{ id: number }>> {
  try {
    const session = await requireRole(ADMIN_ONLY)
    const formId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(formId) || formId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const existing = await prisma.crmForm.findFirst({ where: { id: formId, deletedAt: null }, select: { id: true } })
    if (!existing) return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }

    await prisma.crmForm.update({ where: { id: formId }, data: { deletedAt: new Date(), status: 'ARCHIVED' } })
    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: formId,
      action: 'DELETE',
      metadata: { soft: true },
    })
    return { ok: true, data: { id: formId } }
  } catch (e) {
    return mapError(e)
  }
}

export async function addField(
  formId: unknown,
  raw: unknown,
): Promise<FormsServiceResult<{ id: number; formId: number; fieldKey: string }>> {
  try {
    const session = await requireRole(ALL_ROLES)
    const fid = typeof formId === 'string' || typeof formId === 'number' ? Number(formId) : NaN
    if (!Number.isInteger(fid) || fid < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const parsed = createFieldSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      }
    }
    const input = parsed.data

    const form = await prisma.crmForm.findFirst({ where: { id: fid, deletedAt: null }, select: { id: true } })
    if (!form) return { ok: false, error: { code: 'NOT_FOUND', message: 'Formulario no encontrado.' } }

    const uniqueKey = await uniqueFieldKey(fid, input.fieldKey)
    const count = await prisma.crmFormField.count({ where: { formId: fid } })

    const field = await prisma.crmFormField.create({
      data: {
        formId: fid,
        type: input.type,
        label: input.label,
        fieldKey: uniqueKey,
        placeholder: input.placeholder ?? null,
        helpText: input.helpText ?? null,
        isRequired: input.isRequired,
        contactTarget: input.contactTarget,
        position: count,
        config: input.config ?? Prisma.JsonNull,
      },
    })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: fid,
      action: 'UPDATE',
      changes: { addedField: { id: field.id, fieldKey: field.fieldKey, type: field.type } },
    })

    return { ok: true, data: { id: field.id, formId: fid, fieldKey: uniqueKey } }
  } catch (e) {
    return mapError(e)
  }
}

export async function updateField(
  fieldId: unknown,
  raw: unknown,
): Promise<FormsServiceResult<{ id: number; formId: number; fieldKey: string }>> {
  try {
    const session = await requireRole(ALL_ROLES)
    const fid = typeof fieldId === 'string' || typeof fieldId === 'number' ? Number(fieldId) : NaN
    if (!Number.isInteger(fid) || fid < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const parsed = updateFieldSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      }
    }
    const input = parsed.data

    const existing = await prisma.crmFormField.findUnique({
      where: { id: fid },
      select: { id: true, formId: true, fieldKey: true, label: true, type: true, isRequired: true, contactTarget: true },
    })
    if (!existing) return { ok: false, error: { code: 'NOT_FOUND', message: 'Campo no encontrado.' } }

    const data: Prisma.CrmFormFieldUpdateInput = {}
    if (input.type !== undefined) data.type = input.type as CrmFormFieldType
    if (input.label !== undefined) data.label = input.label
    if (input.fieldKey !== undefined && input.fieldKey !== existing.fieldKey) {
      // Re-check uniqueness with the new key.
      data.fieldKey = await uniqueFieldKey(existing.formId, input.fieldKey, existing.id)
    }
    if (input.placeholder !== undefined) data.placeholder = input.placeholder ?? null
    if (input.helpText !== undefined) data.helpText = input.helpText ?? null
    if (input.isRequired !== undefined) data.isRequired = input.isRequired
    if (input.contactTarget !== undefined) data.contactTarget = input.contactTarget
    if (input.config !== undefined) data.config = input.config ?? Prisma.JsonNull

    const field = await prisma.crmFormField.update({ where: { id: fid }, data })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: existing.formId,
      action: 'UPDATE',
      changes: { updatedField: { id: field.id, fieldKey: field.fieldKey } },
    })

    return { ok: true, data: { id: field.id, formId: existing.formId, fieldKey: field.fieldKey } }
  } catch (e) {
    return mapError(e)
  }
}

export async function removeField(fieldId: unknown): Promise<FormsServiceResult<{ id: number; formId: number }>> {
  try {
    const session = await requireRole(ALL_ROLES)
    const fid = typeof fieldId === 'string' || typeof fieldId === 'number' ? Number(fieldId) : NaN
    if (!Number.isInteger(fid) || fid < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const existing = await prisma.crmFormField.findUnique({
      where: { id: fid },
      select: { id: true, formId: true, position: true },
    })
    if (!existing) return { ok: false, error: { code: 'NOT_FOUND', message: 'Campo no encontrado.' } }

    await prisma.$transaction([
      prisma.crmFormField.delete({ where: { id: fid } }),
      prisma.crmFormField.updateMany({
        where: { formId: existing.formId, position: { gt: existing.position } },
        data: { position: { decrement: 1 } },
      }),
    ])

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: existing.formId,
      action: 'UPDATE',
      changes: { removedField: { id: fid } },
    })

    return { ok: true, data: { id: fid, formId: existing.formId } }
  } catch (e) {
    return mapError(e)
  }
}

/**
 * Persist a new order of fields (their `position` column). Validates that
 * `orderedFieldIds` covers exactly the field IDs the form owns — no add,
 * no remove, just reorder.
 */
export async function reorderFields(
  formId: unknown,
  raw: unknown,
): Promise<FormsServiceResult<{ id: number; positions: { id: number; position: number }[] }>> {
  try {
    const session = await requireRole(ALL_ROLES)
    const fid = typeof formId === 'string' || typeof formId === 'number' ? Number(formId) : NaN
    if (!Number.isInteger(fid) || fid < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const parsed = reorderFieldsSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Orden inválido',
          fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      }
    }
    const order = parsed.data.orderedFieldIds

    const existing = await prisma.crmFormField.findMany({
      where: { formId: fid },
      select: { id: true },
    })
    const existingIds = new Set(existing.map((f) => f.id))
    if (order.length !== existingIds.size || order.some((id) => !existingIds.has(id))) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'El orden no coincide con los campos del formulario.' } }
    }

    const updates = order.map((id, position) =>
      prisma.crmFormField.update({ where: { id }, data: { position } }),
    )
    await prisma.$transaction(updates)

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'CrmForm',
      entityId: fid,
      action: 'UPDATE',
      changes: { reorderedFieldIds: order },
    })

    return {
      ok: true,
      data: { id: fid, positions: order.map((id, position) => ({ id, position })) },
    }
  } catch (e) {
    return mapError(e)
  }
}

export type SubmitFormReport = {
  submissionId: number
  contactId: number | null
  contactCreated: boolean
  successMessage: string
  contactData: { name?: string; email?: string; phone?: string }
  formSlug: string
  formName: string
}

export type SubmitFormMeta = {
  ipHash?: string | null
  userAgent?: string | null
}

function hashIp(value: string | null | undefined): string | null {
  if (!value) return null
  return createHash('sha256').update(value).digest('hex').slice(0, 64)
}

/**
 * Hash an IP address for storage (public-facing). Exposed so the REST
 * endpoint and the server action can share the same normalization.
 */
export async function hashIpForSubmit(value: string | null | undefined): Promise<string | null> {
  return hashIp(value)
}

/**
 * Canonical submission flow used by both the server action (form action
 * bound to the page) and the REST endpoint (`/api/forms/[slug]/submit`).
 *
 * Input shape is `{ [fieldKey]: string }`. Conditional logic is evaluated
 * server-side: a hidden field's `isRequired` is not enforced. Dedupe order:
 * email -> phone (when no email captured).
 */
export async function submitForm(
  slug: string,
  values: Record<string, string>,
  meta: SubmitFormMeta = {},
): Promise<FormsServiceResult<SubmitFormReport>> {
  try {
    const form = await prisma.crmForm.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      select: {
        id: true,
        name: true,
        successMessage: true,
        fields: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            fieldKey: true,
            type: true,
            label: true,
            isRequired: true,
            contactTarget: true,
            config: true,
          },
        },
      },
    })
    if (!form) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Este formulario no está disponible.' } }
    }

    // Build the canonical value map (raw, trimmed) keyed by fieldKey
    // so the conditional evaluator can reference any sibling field.
    const trimmed: Record<string, string> = {}
    for (const field of form.fields) {
      const v = values[field.fieldKey]
      trimmed[field.fieldKey] = typeof v === 'string' ? v.trim() : ''
    }

    type Row = { fieldId: number; rawValue: string | null; normalizedValue: string | null }
    const rows: Row[] = []
    const contactData: { name?: string; email?: string; phone?: string } = {}

    for (const field of form.fields) {
      const visible = shouldShowField(field, trimmed)
      const raw = trimmed[field.fieldKey] ?? ''

      // Required is only enforced when the field is actually shown.
      const error = validateFieldValue(field.type, raw, visible && field.isRequired, field.config)
      if (error) {
        return {
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: `${field.label}: ${error}` },
        }
      }

      // A hidden field is not persisted — keeps submissions clean and
      // avoids leaking values that the user never had a chance to fill.
      if (!visible) continue

      const normalized = raw ? normalizeValue(field.type, raw, field.config) : ''

      if (field.contactTarget === 'NAME' && normalized && !contactData.name) contactData.name = raw
      if (field.contactTarget === 'EMAIL' && normalized && !contactData.email) contactData.email = normalized
      if (field.contactTarget === 'PHONE' && normalized && !contactData.phone) contactData.phone = normalized

      rows.push({
        fieldId: field.id,
        rawValue: raw || null,
        normalizedValue: normalized || null,
      })
    }

    const ipHash = meta.ipHash ?? null
    const userAgent = meta.userAgent ?? null

    const result = await prisma.$transaction(async (tx) => {
      let contactId: number | null = null
      let contactCreated = false

      // Dedupe order: email first (canonical identifier), phone fallback
      // when the form doesn't capture an email at all.
      if (contactData.email) {
        const existing = await tx.contact.findUnique({
          where: { email: contactData.email },
          select: { id: true, name: true, phone: true, deletedAt: true },
        })
        if (existing) {
          const update: { name?: string; phone?: string; deletedAt?: null } = {}
          if (!existing.name && contactData.name) update.name = contactData.name
          if (!existing.phone && contactData.phone) update.phone = contactData.phone
          if (existing.deletedAt) update.deletedAt = null
          if (Object.keys(update).length > 0) {
            await tx.contact.update({ where: { id: existing.id }, data: update })
          }
          contactId = existing.id
        } else {
          const c = await tx.contact.create({
            data: {
              name: contactData.name || contactData.email,
              email: contactData.email,
              phone: contactData.phone ?? null,
              source: 'FORM',
            },
            select: { id: true },
          })
          contactId = c.id
          contactCreated = true
        }
      } else if (contactData.phone) {
        // Phone-only dedupe: BR §2.5 says match by phone when no email is
        // captured. We do NOT create a new contact in this branch because
        // Contact.email is required + unique at the DB level — minting a
        // synthetic email would pollute the table. The submission is still
        // saved (orphan: contactId = null) so the data isn't lost.
        const existing = await tx.contact.findFirst({
          where: { phone: contactData.phone, deletedAt: null },
          orderBy: { updatedAt: 'desc' },
          select: { id: true, name: true },
        })
        if (existing) {
          if (!existing.name && contactData.name) {
            await tx.contact.update({ where: { id: existing.id }, data: { name: contactData.name } })
          }
          contactId = existing.id
        }
      }

      const submission = await tx.crmFormSubmission.create({
        data: {
          formId: form.id,
          contactId,
          ipHash,
          userAgent,
        },
        select: { id: true },
      })

      if (rows.length > 0) {
        await tx.crmFormSubmissionValue.createMany({
          data: rows.map((row) => ({
            submissionId: submission.id,
            ...row,
          })),
        })
      }

      if (contactId) {
        await tx.contactActivity.create({
          data: {
            contactId,
            type: 'FORM_SUBMITTED',
            body: `Envío del formulario "${form.name}".`,
          },
        })
      }

      return { submissionId: submission.id, contactId, contactCreated }
    })

    return {
      ok: true,
      data: {
        ...result,
        successMessage: form.successMessage,
        contactData,
        formSlug: slug,
        formName: form.name,
      },
    }
  } catch (e) {
    return mapError(e)
  }
}

/**
 * Internal — produce a fieldKey that doesn't collide with any other field
 * in the same form. When `selfId` is supplied (during an update) the
 * existing row is excluded from the collision search.
 */
async function uniqueFieldKey(formId: number, base: string, selfId?: number): Promise<string> {
  const trimmed = base.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'campo'
  // Evita `startsWith` en SQL (LIKE + mezcla utf8mb4_unicode_ci / utf8mb4_bin en algunos hosts).
  const rows = await prisma.crmFormField.findMany({
    where: { formId, ...(selfId ? { id: { not: selfId } } : {}) },
    select: { fieldKey: true },
  })
  const taken = new Set(rows.map((r) => r.fieldKey).filter((k) => k.startsWith(trimmed)))
  if (!taken.has(trimmed)) return trimmed
  let n = 2
  while (taken.has(`${trimmed}_${n}`)) n++
  return `${trimmed}_${n}`
}
