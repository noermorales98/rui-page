import type { CommercialStatus, DealStage, RegistrationStatus } from '@prisma/client'

export type DealRow = {
  id: number
  stage: DealStage
  courseName: string | null
  sales: { amountCents: number }[]
}

export type RegistrationRow = {
  id: number
  status: RegistrationStatus
  commercialStatus: CommercialStatus
  createdAt: Date | string
  contactId: number
  registrationCount: number
  registrationDates: unknown
  contact: {
    id: number
    name: string
    email: string
    phone: string | null
    activities: { id: number; createdAt: Date | string; type: string }[]
    deals: DealRow[]
  }
}

export type LeadScore = 'CALIENTE' | 'TIBIO' | 'FRIO'

export function calcLeadScore(row: RegistrationRow): LeadScore {
  if (row.status === 'PURCHASED') return 'CALIENTE'
  if (row.status === 'ATTENDED' && (row.commercialStatus === 'INTERESADO' || row.commercialStatus === 'PLAN_PAGOS')) return 'CALIENTE'
  if (row.commercialStatus === 'NO_RESPONDE' || row.commercialStatus === 'DESCARTADO') return 'FRIO'
  return 'TIBIO'
}

export type FilterKey =
  | 'todos'
  | 'registrados'
  | 'asistieron'
  | 'no_asistieron'
  | 'compraron'
  | 'no_compraron'
  | 'contactados'
  | 'sin_contactar'
  | 'caliente'
  | 'plan_pagos'

export function applyFilter(rows: RegistrationRow[], filter: FilterKey): RegistrationRow[] {
  switch (filter) {
    case 'todos': return rows
    case 'registrados': return rows.filter((r) => r.status === 'REGISTERED')
    case 'asistieron': return rows.filter((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED')
    case 'no_asistieron': return rows.filter((r) => r.status === 'REGISTERED')
    case 'compraron': return rows.filter((r) => r.status === 'PURCHASED')
    case 'no_compraron': return rows.filter((r) => r.status !== 'PURCHASED')
    case 'contactados': return rows.filter((r) => r.commercialStatus !== 'SIN_CONTACTAR')
    case 'sin_contactar': return rows.filter((r) => r.commercialStatus === 'SIN_CONTACTAR')
    case 'caliente': return rows.filter((r) => calcLeadScore(r) === 'CALIENTE')
    case 'plan_pagos': return rows.filter((r) => r.commercialStatus === 'PLAN_PAGOS')
  }
}

export type SeguimientoMetrics = {
  total: number
  attended: number
  notAttended: number
  purchased: number
  conversionPct: number
  revenueCents: number
  hotLeads: number
}

export function calcMetrics(rows: RegistrationRow[]): SeguimientoMetrics {
  const total = rows.length
  const attended = rows.filter((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED').length
  const purchased = rows.filter((r) => r.status === 'PURCHASED').length
  const hotLeads = rows.filter((r) => calcLeadScore(r) === 'CALIENTE').length
  const revenueCents = rows.flatMap((r) => r.contact.deals.flatMap((d) => d.sales)).reduce((sum, s) => sum + s.amountCents, 0)
  return {
    total,
    attended,
    notAttended: total - attended,
    purchased,
    conversionPct: attended > 0 ? Math.round((purchased / attended) * 100) : 0,
    revenueCents,
    hotLeads,
  }
}
