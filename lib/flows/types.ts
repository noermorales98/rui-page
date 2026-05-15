import type { FlowTrigger } from '@prisma/client'

export type DispatchPayload = {
  contactId?: number
  formId?: number
  landingId?: number
  funnelId?: number
  webinarId?: number
  saleId?: number
  productName?: string
  meta?: Record<string, unknown>
}

export type DispatchResult = {
  redirectUrl?: string
  runIds: number[]
}

export type DispatchFn = (trigger: FlowTrigger, payload: DispatchPayload) => Promise<DispatchResult>
