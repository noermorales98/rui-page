'use server'

import type { CommercialStatus, DealStage } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  moveDeal as moveDealService,
  createDeal as createDealService,
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
  if (!contactId || contactId < 1) return { error: 'Contacto inválido' }

  const r = await createDealService({ contactId, courseName: courseName.trim() || undefined, stage: 'LEAD' })
  if (!r.ok) return { error: r.error.message }
  revalidatePath(seguimientoPath(webinarId))
  return { dealId: r.data.id }
}

export async function moveDealStage(
  dealId: number,
  stage: DealStage,
  webinarId: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }
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

  if (!contactId || contactId < 1) return { error: 'Contacto inválido' }
  if (!body.trim()) return { error: 'La nota no puede estar vacía' }

  try {
    const uid = Number(session.user.id)
    const createdById = Number.isInteger(uid) && uid > 0 ? uid : null
    await prisma.contactActivity.create({
      data: { contactId, type: 'NOTE', body: body.trim(), createdById },
    })
    revalidatePath(seguimientoPath(webinarId))
    revalidatePath(`/crm/contactos/${contactId}`)
  } catch {
    return { error: 'Error al guardar la nota' }
  }
  return {}
}
