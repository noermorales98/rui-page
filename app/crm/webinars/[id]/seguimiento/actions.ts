'use server'

import type { CommercialStatus, DealStage } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  moveDeal as moveDealService,
} from '@/lib/services/deals'

function seguimientoPath(webinarId: number) {
  return `/crm/webinars/${webinarId}/seguimiento`
}

export async function updateCommercialStatus(
  registrationId: number,
  status: CommercialStatus,
  webinarId: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    await prisma.webinarRegistration.update({
      where: { id: registrationId },
      data: { commercialStatus: status },
    })
    revalidatePath(seguimientoPath(webinarId))
  } catch {
    return { error: 'Error al actualizar el estado comercial' }
  }
  return {}
}

export async function createDealForContact(
  contactId: number,
  courseName: string,
  webinarId: number,
): Promise<{ error?: string; dealId?: number }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    const deal = await prisma.deal.create({
      data: { contactId, courseName: courseName.trim() || null, stage: 'LEAD' },
      select: { id: true },
    })
    revalidatePath(seguimientoPath(webinarId))
    return { dealId: deal.id }
  } catch {
    return { error: 'Error al crear la oportunidad' }
  }
}

export async function moveDealStage(
  dealId: number,
  stage: DealStage,
  webinarId: number,
): Promise<{ error?: string }> {
  const r = await moveDealService(dealId, { toStage: stage })
  if (!r.ok) return { error: r.error.message }
  revalidatePath(seguimientoPath(webinarId))
  return {}
}

export async function addNoteToContact(
  contactId: number,
  body: string,
  webinarId: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  if (!body.trim()) return { error: 'La nota no puede estar vacía' }

  try {
    await prisma.contactActivity.create({
      data: { contactId, type: 'NOTE', body: body.trim(), createdById: Number(session.user.id) },
    })
    revalidatePath(seguimientoPath(webinarId))
  } catch {
    return { error: 'Error al guardar la nota' }
  }
  return {}
}
