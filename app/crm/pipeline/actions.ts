'use server'

import type { DealStage } from '@prisma/client'
import {
  createDeal as createDealService,
  moveDeal as moveDealService,
  softDeleteDeal as softDeleteDealService,
  updateDeal as updateDealService,
} from '@/lib/services/deals'
import type { ApiError } from '@/lib/errors/map'

type DealState = { error: string } | null

function messageFor(error: ApiError): string {
  if (error.code === 'VALIDATION_ERROR') {
    const firstField = Object.entries(error.fields ?? {})[0]
    const firstMessage = firstField?.[1]?.[0]
    return firstMessage ?? error.message
  }
  return error.message
}

function readDealFormData(formData: FormData) {
  return {
    contactId: formData.get('contactId'),
    courseName: (formData.get('courseName') as string | null) ?? undefined,
    stage: (formData.get('stage') as string | null) ?? undefined,
    notes: (formData.get('notes') as string | null) ?? undefined,
  }
}

export async function createDeal(_prev: DealState, formData: FormData): Promise<DealState> {
  const r = await createDealService(readDealFormData(formData))
  if (!r.ok) return { error: messageFor(r.error) }
  return null
}

export async function updateDeal(
  dealId: number,
  _prev: DealState,
  formData: FormData,
): Promise<DealState> {
  const r = await updateDealService(dealId, {
    courseName: (formData.get('courseName') as string | null) ?? undefined,
    stage: (formData.get('stage') as string | null) ?? undefined,
    notes: (formData.get('notes') as string | null) ?? undefined,
  })
  if (!r.ok) return { error: messageFor(r.error) }
  return null
}

export async function deleteDeal(dealId: number): Promise<void> {
  const r = await softDeleteDealService(dealId)
  if (!r.ok && r.error.code !== 'NOT_FOUND') {
    throw new Error(messageFor(r.error))
  }
}

export async function moveDeal(dealId: number, stage: DealStage): Promise<void> {
  const r = await moveDealService(dealId, { toStage: stage })
  if (!r.ok) {
    // Surface to the optimistic UI so it can roll back.
    throw new Error(messageFor(r.error))
  }
}
