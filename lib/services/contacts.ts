'use server'

import type {
  ActivityType,
  Contact,
  ContactStatus,
  ContactTag,
  Prisma,
  Tag,
} from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { requireRole } from '@/lib/auth/permissions'
import { mapError, type ApiError } from '@/lib/errors/map'
import { addActivity as insertContactActivity } from '@/lib/services/_activity'
import {
  createContactSchema,
  importContactRowSchema,
  listContactsFiltersSchema,
  normalizeImportContactRowKeys,
  updateContactSchema,
} from '@/lib/validators/contacts'
import { parseCsvBufferToRecords } from '@/lib/utils/csv'
import { ensureTagsByNames } from '@/lib/services/tags'

export type ContactListRow = Contact & {
  tags: (ContactTag & { tag: Tag })[]
}

export type ContactDetail = Contact & {
  tags: (ContactTag & { tag: Tag })[]
  activities: Prisma.ContactActivityGetPayload<{ include: { createdBy: true } }>[]
}

export type ContactsServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

const STATUS_RANK: Record<ContactStatus, number> = {
  NEW: 0,
  QUALIFIED: 1,
  CLIENT: 2,
}

function isStatusDegrading(from: ContactStatus, to: ContactStatus): boolean {
  return STATUS_RANK[to] < STATUS_RANK[from]
}

async function resolveTagIds(
  tagIds: number[],
  newTagNames: string[],
): Promise<number[]> {
  const fromNames =
    newTagNames.length > 0 ? await ensureTagsByNames(newTagNames) : []
  return [...new Set([...tagIds, ...fromNames])]
}

export async function listContacts(
  raw: unknown,
): Promise<
  ContactsServiceResult<{
    rows: ContactListRow[]
    total: number
    page: number
    take: number
  }>
> {
  try {
    await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const parsed = listContactsFiltersSchema.safeParse(raw)
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
    const f = parsed.data
    const where: Prisma.ContactWhereInput = {
      deletedAt: null,
      ...(f.search
        ? {
            OR: [
              { name: { contains: f.search } },
              { email: { contains: f.search } },
              { phone: { contains: f.search } },
            ],
          }
        : {}),
      ...(f.status.length ? { status: { in: f.status } } : {}),
      ...(f.source.length ? { source: { in: f.source } } : {}),
      ...(f.tagId
        ? {
            tags: {
              some: {
                tagId: f.tagId,
                tag: { deletedAt: null },
              },
            },
          }
        : {}),
    }

    const skip = (f.page - 1) * f.take
    const [rows, total] = await prisma.$transaction([
      prisma.contact.findMany({
        where,
        skip,
        take: f.take,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            where: { tag: { deletedAt: null } },
            include: { tag: true },
          },
        },
      }),
      prisma.contact.count({ where }),
    ])

    return { ok: true, data: { rows, total, page: f.page, take: f.take } }
  } catch (e) {
    return mapError(e)
  }
}

export async function getContact(
  id: unknown,
): Promise<ContactsServiceResult<ContactDetail>> {
  try {
    await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const pid =
      typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(pid) || pid < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' },
      }
    }

    const contact = await prisma.contact.findFirst({
      where: { id: pid, deletedAt: null },
      include: {
        tags: {
          where: { tag: { deletedAt: null } },
          include: { tag: true },
        },
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: true },
        },
      },
    })

    if (!contact) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }

    return { ok: true, data: contact }
  } catch (e) {
    return mapError(e)
  }
}

export async function createContact(
  raw: unknown,
  options: { tagIds: number[]; newTagNames: string[] } = { tagIds: [], newTagNames: [] },
): Promise<ContactsServiceResult<Contact>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const parsed = createContactSchema.safeParse(raw)
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

    const allTagIds = await resolveTagIds(options.tagIds, options.newTagNames)

    const contact = await prisma.contact.create({
      data: {
        ...parsed.data,
        tags: {
          create: allTagIds.map((tagId) => ({ tagId })),
        },
      },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Contact',
      entityId: contact.id,
      action: 'CREATE',
      metadata: { email: contact.email },
    })

    revalidatePath('/crm/contactos')
    return { ok: true, data: contact }
  } catch (e) {
    return mapError(e)
  }
}

export async function updateContact(
  id: unknown,
  raw: unknown,
  options: { tagIds: number[]; newTagNames: string[] } = { tagIds: [], newTagNames: [] },
): Promise<ContactsServiceResult<Contact>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const contactId =
      typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(contactId) || contactId < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' },
      }
    }

    const parsed = updateContactSchema.safeParse(raw)
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

    const existing = await prisma.contact.findFirst({
      where: { id: contactId, deletedAt: null },
    })
    if (!existing) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }

    const nextStatus = (parsed.data.status ?? existing.status) as ContactStatus
    if (isStatusDegrading(existing.status, nextStatus) && session.user.role !== 'ADMIN') {
      return {
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Solo un administrador puede degradar el estado del contacto.',
        },
      }
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {}
    const fields = ['name', 'email', 'phone', 'source', 'status'] as const
    for (const key of fields) {
      const nextVal = parsed.data[key]
      if (nextVal === undefined) continue
      const prevVal = existing[key]
      if (prevVal !== nextVal) {
        changes[key] = { from: prevVal, to: nextVal }
      }
    }

    const allTagIds = await resolveTagIds(options.tagIds, options.newTagNames)
    const prevTagLinks = await prisma.contactTag.findMany({
      where: { contactId },
      select: { tagId: true },
    })
    const prevTagIds = prevTagLinks.map((t) => t.tagId).sort((a, b) => a - b)
    const nextSorted = [...allTagIds].sort((a, b) => a - b)
    const tagsChanged =
      prevTagIds.length !== nextSorted.length ||
      prevTagIds.some((v, i) => v !== nextSorted[i])
    if (tagsChanged) {
      changes.tags = { from: prevTagIds, to: nextSorted }
    }

    const contact = await prisma.$transaction(async (tx) => {
      await tx.contactTag.deleteMany({ where: { contactId } })
      return tx.contact.update({
        where: { id: contactId },
        data: {
          ...parsed.data,
          tags: {
            create: allTagIds.map((tagId) => ({ tagId })),
          },
        },
      })
    })

    if (Object.keys(changes).length > 0) {
      await logAudit({
        actorId: Number(session.user.id),
        entityType: 'Contact',
        entityId: contactId,
        action: 'UPDATE',
        changes: changes as Prisma.InputJsonValue,
      })
    }

    revalidatePath('/crm/contactos')
    revalidatePath(`/crm/contactos/${contactId}`)
    return { ok: true, data: contact }
  } catch (e) {
    return mapError(e)
  }
}

export async function softDeleteContact(
  id: unknown,
): Promise<ContactsServiceResult<{ id: number }>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR'])
    const contactId =
      typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(contactId) || contactId < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' },
      }
    }

    const existing = await prisma.contact.findFirst({
      where: { id: contactId, deletedAt: null },
    })
    if (!existing) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }

    await prisma.contact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Contact',
      entityId: contactId,
      action: 'DELETE',
      metadata: { email: existing.email },
    })

    revalidatePath('/crm/contactos')
    revalidatePath(`/crm/contactos/${contactId}`)
    return { ok: true, data: { id: contactId } }
  } catch (e) {
    return mapError(e)
  }
}

export type ImportContactsCsvSummary = {
  inserted: number
  updated: number
  errors: Array<{ row: number; message: string }>
}

export async function importContactsCsv(
  rows: unknown,
): Promise<ContactsServiceResult<ImportContactsCsvSummary>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    if (!Array.isArray(rows)) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Formato de filas inválido' },
      }
    }

    let inserted = 0
    let updated = 0
    const errors: Array<{ row: number; message: string }> = []
    const seenEmails = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2
      const parsed = importContactRowSchema.safeParse(rows[i])
      if (!parsed.success) {
        errors.push({
          row: rowNum,
          message: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        })
        continue
      }
      const data = parsed.data
      const emailKey = data.email.toLowerCase()
      if (seenEmails.has(emailKey)) {
        errors.push({ row: rowNum, message: 'Email duplicado en el archivo' })
        continue
      }
      seenEmails.add(emailKey)

      const existing = await prisma.contact.findUnique({
        where: { email: data.email },
      })

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            phone: data.phone ?? null,
            source: data.source,
            deletedAt: null,
          },
        })
        updated++
      } else {
        await prisma.contact.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            source: data.source,
            status: 'NEW',
          },
        })
        inserted++
      }
    }

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Contact',
      entityId: 0,
      action: 'CREATE',
      metadata: {
        kind: 'IMPORT_CSV',
        inserted,
        updated,
        errorCount: errors.length,
      },
    })

    revalidatePath('/crm/contactos')
    return { ok: true, data: { inserted, updated, errors } }
  } catch (e) {
    return mapError(e)
  }
}

export async function importContactsCsvFromBuffer(
  buffer: Buffer,
): Promise<ContactsServiceResult<ImportContactsCsvSummary>> {
  try {
    const records = parseCsvBufferToRecords(buffer)
    const rows = records.map((r) =>
      normalizeImportContactRowKeys(r as Record<string, unknown>),
    )
    return await importContactsCsv(rows)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('demasiado grande')) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: msg },
      }
    }
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'No se pudo leer el CSV. Revisa el formato, la cabecera y el separador (, o ;).',
      },
    }
  }
}

export async function addTag(
  contactId: unknown,
  tagId: unknown,
): Promise<ContactsServiceResult<{ contactId: number; tagId: number }>> {
  try {
    await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const cid =
      typeof contactId === 'string' || typeof contactId === 'number'
        ? Number(contactId)
        : NaN
    const tid =
      typeof tagId === 'string' || typeof tagId === 'number' ? Number(tagId) : NaN
    if (!Number.isInteger(cid) || cid < 1 || !Number.isInteger(tid) || tid < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' },
      }
    }

    const contact = await prisma.contact.findFirst({
      where: { id: cid, deletedAt: null },
    })
    if (!contact) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }

    const tag = await prisma.tag.findFirst({
      where: { id: tid, deletedAt: null },
    })
    if (!tag) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'La etiqueta no existe.' },
      }
    }

    try {
      await prisma.contactTag.create({
        data: { contactId: cid, tagId: tid },
      })
    } catch (e) {
      if (
        e !== null &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        return { ok: true, data: { contactId: cid, tagId: tid } }
      }
      throw e
    }

    revalidatePath('/crm/contactos')
    revalidatePath(`/crm/contactos/${cid}`)
    return { ok: true, data: { contactId: cid, tagId: tid } }
  } catch (e) {
    return mapError(e)
  }
}

export async function removeTag(
  contactId: unknown,
  tagId: unknown,
): Promise<ContactsServiceResult<{ contactId: number; tagId: number }>> {
  try {
    await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const cid =
      typeof contactId === 'string' || typeof contactId === 'number'
        ? Number(contactId)
        : NaN
    const tid =
      typeof tagId === 'string' || typeof tagId === 'number' ? Number(tagId) : NaN
    if (!Number.isInteger(cid) || cid < 1 || !Number.isInteger(tid) || tid < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' },
      }
    }

    await prisma.contactTag.deleteMany({
      where: { contactId: cid, tagId: tid },
    })

    revalidatePath('/crm/contactos')
    revalidatePath(`/crm/contactos/${cid}`)
    return { ok: true, data: { contactId: cid, tagId: tid } }
  } catch (e) {
    return mapError(e)
  }
}

export async function addActivity(
  contactId: unknown,
  type: ActivityType,
  body?: string | null,
): Promise<ContactsServiceResult<{ id: number }>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const cid =
      typeof contactId === 'string' || typeof contactId === 'number'
        ? Number(contactId)
        : NaN
    if (!Number.isInteger(cid) || cid < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' },
      }
    }

    const contact = await prisma.contact.findFirst({
      where: { id: cid, deletedAt: null },
    })
    if (!contact) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }

    await insertContactActivity(
      cid,
      type,
      body ?? null,
      Number(session.user.id),
    )

    revalidatePath(`/crm/contactos/${cid}`)
    return { ok: true, data: { id: cid } }
  } catch (e) {
    return mapError(e)
  }
}
