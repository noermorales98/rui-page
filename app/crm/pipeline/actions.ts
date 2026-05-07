'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { DealStage } from '@prisma/client'

const stageValues = Object.values(DealStage) as [DealStage, ...DealStage[]]

const dealSchema = z.object({
  contactId: z.coerce.number().positive('Selecciona un contacto'),
  courseName: z.string().optional(),
  stage: z.enum(stageValues).default('LEAD'),
  notes: z.string().optional(),
})

const updateDealSchema = dealSchema.omit({ contactId: true })

type DealState = { error: string } | null

export async function createDeal(
  prevState: DealState,
  formData: FormData,
): Promise<DealState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    contactId: formData.get('contactId'),
    courseName: (formData.get('courseName') as string) || undefined,
    stage: (formData.get('stage') as string) || 'LEAD',
    notes: (formData.get('notes') as string) || undefined,
  }

  const parsed = dealSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await prisma.deal.create({
      data: {
        contactId: parsed.data.contactId,
        courseName: parsed.data.courseName ?? null,
        stage: parsed.data.stage,
        notes: parsed.data.notes ?? null,
      },
    })
  } catch {
    return { error: 'Error al guardar la oportunidad' }
  }

  revalidatePath('/crm/pipeline')
  revalidatePath(`/crm/contactos/${parsed.data.contactId}`)
  return null
}

export async function updateDeal(
  dealId: number,
  prevState: DealState,
  formData: FormData,
): Promise<DealState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    courseName: (formData.get('courseName') as string) || undefined,
    stage: (formData.get('stage') as string) || 'LEAD',
    notes: (formData.get('notes') as string) || undefined,
  }

  const parsed = updateDealSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const existing = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { contactId: true },
  })
  if (!existing) return { error: 'Oportunidad no encontrada' }

  try {
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        courseName: parsed.data.courseName ?? null,
        stage: parsed.data.stage,
        notes: parsed.data.notes ?? null,
      },
    })
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      return { error: 'Oportunidad no encontrada' }
    }
    return { error: 'Error al actualizar la oportunidad' }
  }

  revalidatePath('/crm/pipeline')
  revalidatePath(`/crm/contactos/${existing.contactId}`)
  return null
}

export async function deleteDeal(dealId: number): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  let contactId: number | null = null

  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { contactId: true },
    })
    contactId = deal?.contactId ?? null

    await prisma.deal.delete({ where: { id: dealId } })
  } catch (err: unknown) {
    if (
      !(
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      )
    ) {
      throw err
    }
  }

  revalidatePath('/crm/pipeline')
  if (contactId !== null) revalidatePath(`/crm/contactos/${contactId}`)
}

export async function moveDeal(dealId: number, stage: DealStage): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.deal.update({
    where: { id: dealId },
    data: { stage },
  })

  revalidatePath('/crm/pipeline')
}
