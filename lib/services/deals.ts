'use server'

import type { DealStage, Prisma, Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { addActivity as insertActivity } from '@/lib/services/_activity'
import { mapError, type ApiError } from '@/lib/errors/map'
import {
  PIPELINE_STAGES,
  createDealSchema,
  moveDealSchema,
  updateDealSchema,
} from '@/lib/validators/deals'

const ALL_ROLES: Role[] = ['ADMIN', 'VENDEDOR', 'ASISTENTE']
const NON_ASISTENTE: Role[] = ['ADMIN', 'VENDEDOR']
const ADMIN_ONLY: Role[] = ['ADMIN']

const STAGE_LABEL: Record<DealStage, string> = {
  LEAD: 'Lead',
  DEMO: 'Demo',
  NEGOTIATION: 'Negociación',
  ENROLLED: 'Cerrado',
}

export type DealsServiceResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

const dealListInclude = {
  contact: { select: { id: true, name: true, email: true, phone: true, status: true } },
  sales: { where: { deletedAt: null }, select: { id: true, status: true } },
} satisfies Prisma.DealInclude

export type DealListItem = Prisma.DealGetPayload<{ include: typeof dealListInclude }>

const dealDetailInclude = {
  contact: { select: { id: true, name: true, email: true, phone: true, status: true } },
  sales: {
    where: { deletedAt: null },
    select: { id: true, status: true, amountCents: true, currency: true, soldAt: true, productName: true },
    orderBy: { soldAt: 'desc' as const },
  },
} satisfies Prisma.DealInclude

export type DealDetail = Prisma.DealGetPayload<{ include: typeof dealDetailInclude }>

export type DealsGrouped = Record<DealStage, DealListItem[]>

function actorId(rawId: string): number | null {
  const n = Number(rawId)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function listDealsGrouped(): Promise<DealsServiceResult<DealsGrouped>> {
  try {
    await requireRole(ALL_ROLES)
    const deals = await prisma.deal.findMany({
      where: { deletedAt: null, contact: { deletedAt: null } },
      include: dealListInclude,
      orderBy: { updatedAt: 'desc' },
    })

    const grouped = PIPELINE_STAGES.reduce<DealsGrouped>((acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage)
      return acc
    }, { LEAD: [], DEMO: [], NEGOTIATION: [], ENROLLED: [] })

    return { ok: true, data: grouped }
  } catch (e) {
    return mapError(e)
  }
}

export async function getDeal(id: unknown): Promise<DealsServiceResult<DealDetail>> {
  try {
    await requireRole(ALL_ROLES)
    const dealId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(dealId) || dealId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
      include: dealDetailInclude,
    })
    if (!deal) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }
    }
    return { ok: true, data: deal }
  } catch (e) {
    return mapError(e)
  }
}

export async function createDeal(raw: unknown): Promise<DealsServiceResult<DealListItem>> {
  try {
    const session = await requireRole(NON_ASISTENTE)
    const parsed = createDealSchema.safeParse(raw)
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

    const contact = await prisma.contact.findFirst({
      where: { id: input.contactId, deletedAt: null },
      select: { id: true, status: true },
    })
    if (!contact) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'El contacto no existe.' } }
    }

    const deal = await prisma.$transaction(async (tx) => {
      const created = await tx.deal.create({
        data: {
          contactId: input.contactId,
          courseName: input.courseName ?? null,
          stage: input.stage,
          notes: input.notes ?? null,
        },
        include: dealListInclude,
      })
      // BR §2.1: Contact.status sube a QUALIFIED cuando se agrega a un Deal.
      if (contact.status === 'NEW') {
        await tx.contact.update({
          where: { id: contact.id },
          data: { status: 'QUALIFIED' },
        })
      }
      return created
    })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'Deal',
      entityId: deal.id,
      action: 'CREATE',
      changes: {
        contactId: deal.contactId,
        stage: deal.stage,
        courseName: deal.courseName,
      },
    })
    if (contact.status === 'NEW') {
      await logAudit({
        actorId: actorId(session.user.id),
        entityType: 'Contact',
        entityId: contact.id,
        action: 'STATUS_CHANGE',
        changes: { status: { from: 'NEW', to: 'QUALIFIED' } },
        metadata: { reason: 'deal_created', dealId: deal.id },
      })
    }

    revalidatePath('/crm/pipeline')
    revalidatePath(`/crm/contactos/${deal.contactId}`)
    return { ok: true, data: deal }
  } catch (e) {
    return mapError(e)
  }
}

export async function updateDeal(id: unknown, raw: unknown): Promise<DealsServiceResult<DealListItem>> {
  try {
    const session = await requireRole(NON_ASISTENTE)
    const dealId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(dealId) || dealId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const parsed = updateDealSchema.safeParse(raw)
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

    const existing = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
      select: { id: true, contactId: true, stage: true, courseName: true, notes: true },
    })
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }
    }

    const data: Prisma.DealUpdateInput = {}
    const changes: Record<string, { from: string | null; to: string | null }> = {}
    if (parsed.data.courseName !== undefined && parsed.data.courseName !== existing.courseName) {
      data.courseName = parsed.data.courseName ?? null
      changes.courseName = { from: existing.courseName, to: parsed.data.courseName ?? null }
    }
    if (parsed.data.notes !== undefined && parsed.data.notes !== existing.notes) {
      data.notes = parsed.data.notes ?? null
      changes.notes = { from: existing.notes, to: parsed.data.notes ?? null }
    }
    if (parsed.data.stage !== undefined && parsed.data.stage !== existing.stage) {
      data.stage = parsed.data.stage
      changes.stage = { from: existing.stage, to: parsed.data.stage }
    }

    const deal = await prisma.deal.update({
      where: { id: dealId },
      data,
      include: dealListInclude,
    })

    if (Object.keys(changes).length > 0) {
      const stageOnly = Object.keys(changes).length === 1 && changes.stage !== undefined
      await logAudit({
        actorId: actorId(session.user.id),
        entityType: 'Deal',
        entityId: dealId,
        action: stageOnly ? 'STAGE_CHANGE' : 'UPDATE',
        changes,
      })
      if (changes.stage) {
        await insertActivity(
          existing.contactId,
          'NOTE',
          `Deal movido de ${STAGE_LABEL[changes.stage.from as DealStage]} a ${STAGE_LABEL[changes.stage.to as DealStage]}`,
          actorId(session.user.id),
        )
      }
    }

    revalidatePath('/crm/pipeline')
    revalidatePath(`/crm/pipeline/${dealId}`)
    revalidatePath(`/crm/contactos/${existing.contactId}`)
    return { ok: true, data: deal }
  } catch (e) {
    return mapError(e)
  }
}

export async function moveDeal(
  id: unknown,
  raw: unknown,
): Promise<DealsServiceResult<{ id: number; from: DealStage; to: DealStage }>> {
  try {
    const session = await requireRole(NON_ASISTENTE)
    const dealId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(dealId) || dealId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }
    const parsedStage = moveDealSchema.safeParse(raw)
    if (!parsedStage.success) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Etapa inválida' } }
    }
    const toStage = parsedStage.data.toStage

    const existing = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
      select: { id: true, stage: true, contactId: true },
    })
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }
    }
    if (existing.stage === toStage) {
      return { ok: true, data: { id: dealId, from: existing.stage, to: toStage } }
    }

    await prisma.deal.update({ where: { id: dealId }, data: { stage: toStage } })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'Deal',
      entityId: dealId,
      action: 'STAGE_CHANGE',
      changes: { stage: { from: existing.stage, to: toStage } },
    })
    await insertActivity(
      existing.contactId,
      'NOTE',
      `Deal movido de ${STAGE_LABEL[existing.stage]} a ${STAGE_LABEL[toStage]}`,
      actorId(session.user.id),
    )

    revalidatePath('/crm/pipeline')
    revalidatePath(`/crm/pipeline/${dealId}`)
    revalidatePath(`/crm/contactos/${existing.contactId}`)
    return { ok: true, data: { id: dealId, from: existing.stage, to: toStage } }
  } catch (e) {
    return mapError(e)
  }
}

export async function softDeleteDeal(id: unknown): Promise<DealsServiceResult<{ id: number }>> {
  try {
    const session = await requireRole(ADMIN_ONLY)
    const dealId = typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(dealId) || dealId < 1) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' } }
    }

    const existing = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
      select: {
        id: true,
        contactId: true,
        sales: { where: { deletedAt: null, status: 'PAID' }, select: { id: true } },
      },
    })
    if (!existing) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' } }
    }
    if (existing.sales.length > 0) {
      return {
        ok: false,
        error: {
          code: 'CONFLICT',
          message: 'No se puede archivar un deal con ventas pagadas. Reembolsa primero la venta o desactívala.',
        },
      }
    }

    await prisma.deal.update({ where: { id: dealId }, data: { deletedAt: new Date() } })

    await logAudit({
      actorId: actorId(session.user.id),
      entityType: 'Deal',
      entityId: dealId,
      action: 'DELETE',
      metadata: { soft: true },
    })

    revalidatePath('/crm/pipeline')
    revalidatePath(`/crm/contactos/${existing.contactId}`)
    return { ok: true, data: { id: dealId } }
  } catch (e) {
    return mapError(e)
  }
}

