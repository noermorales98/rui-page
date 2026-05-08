import type { ContactStatus, DealStage, Prisma } from '@prisma/client'

const CONTACT_STATUSES = ['NEW', 'QUALIFIED', 'CLIENT'] as const
const DEAL_STAGES = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED'] as const

export type CampaignFilters = {
  registeredOnly: boolean
  pipelineLeadsOnly: boolean
  contactStatuses: ContactStatus[]
  dealStages: DealStage[]
  formIds: number[]
  webinarIds: number[]
  projectQuery: string
}

export const EMPTY_CAMPAIGN_FILTERS: CampaignFilters = {
  registeredOnly: false,
  pipelineLeadsOnly: false,
  contactStatuses: [],
  dealStages: [],
  formIds: [],
  webinarIds: [],
  projectQuery: '',
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values))
}

function normalizeEnumList<T extends string>(
  values: FormDataEntryValue[],
  allowed: readonly T[],
): T[] {
  const allowedValues = new Set<string>(allowed)
  return unique(
    values
      .filter((value): value is string => typeof value === 'string')
      .filter((value): value is T => allowedValues.has(value)),
  )
}

function normalizeIdList(values: FormDataEntryValue[]) {
  return unique(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  )
}

function checkboxIsOn(formData: FormData, name: string) {
  return formData.get(name) === 'on' || formData.get(name) === 'true'
}

export function normalizeCampaignFilters(formData: FormData): CampaignFilters {
  const audiences = new Set(
    formData
      .getAll('audience')
      .filter((value): value is string => typeof value === 'string'),
  )

  return {
    registeredOnly: audiences.has('registered') || checkboxIsOn(formData, 'registeredOnly'),
    pipelineLeadsOnly: audiences.has('pipeline_leads') || checkboxIsOn(formData, 'pipelineLeadsOnly'),
    contactStatuses: normalizeEnumList(formData.getAll('contactStatuses'), CONTACT_STATUSES),
    dealStages: normalizeEnumList(formData.getAll('dealStages'), DEAL_STAGES),
    formIds: normalizeIdList(formData.getAll('formIds')),
    webinarIds: normalizeIdList(formData.getAll('webinarIds')),
    projectQuery: ((formData.get('projectQuery') as string | null) ?? '').trim(),
  }
}

export function coerceCampaignFilters(value: Prisma.JsonValue | null | undefined): CampaignFilters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return EMPTY_CAMPAIGN_FILTERS

  const record = value as Record<string, unknown>
  const toStringArray = (item: unknown) => (Array.isArray(item) ? item.filter((entry): entry is string => typeof entry === 'string') : [])
  const toNumberArray = (item: unknown) => (
    Array.isArray(item)
      ? item.map((entry) => Number(entry)).filter((entry) => Number.isInteger(entry) && entry > 0)
      : []
  )

  return {
    registeredOnly: record.registeredOnly === true,
    pipelineLeadsOnly: record.pipelineLeadsOnly === true,
    contactStatuses: normalizeEnumList(toStringArray(record.contactStatuses), CONTACT_STATUSES),
    dealStages: normalizeEnumList(toStringArray(record.dealStages), DEAL_STAGES),
    formIds: unique(toNumberArray(record.formIds)),
    webinarIds: unique(toNumberArray(record.webinarIds)),
    projectQuery: typeof record.projectQuery === 'string' ? record.projectQuery.trim() : '',
  }
}

export function buildCampaignContactWhere(filters: CampaignFilters): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = []
  const audienceOr: Prisma.ContactWhereInput[] = []

  if (filters.contactStatuses.length > 0) {
    and.push({ status: { in: filters.contactStatuses } })
  }

  if (filters.registeredOnly) {
    audienceOr.push(
      { source: { in: ['FORM', 'WEBINAR'] } },
      { formSubmissions: { some: {} } },
      { registrations: { some: {} } },
    )
  }

  if (filters.pipelineLeadsOnly) {
    audienceOr.push(
      { status: 'NEW' },
      { deals: { some: { stage: 'LEAD' } } },
    )
  }

  if (audienceOr.length > 0) {
    and.push({ OR: audienceOr })
  }

  if (filters.dealStages.length > 0) {
    and.push({ deals: { some: { stage: { in: filters.dealStages } } } })
  }

  if (filters.formIds.length > 0) {
    and.push({ formSubmissions: { some: { formId: { in: filters.formIds } } } })
  }

  if (filters.webinarIds.length > 0) {
    and.push({ registrations: { some: { webinarId: { in: filters.webinarIds } } } })
  }

  if (filters.projectQuery) {
    and.push({ deals: { some: { courseName: { contains: filters.projectQuery } } } })
  }

  return and.length > 0 ? { AND: and } : {}
}

export function formatCampaignAudience(filters: CampaignFilters) {
  const parts: string[] = []

  if (filters.registeredOnly) parts.push('Registrados')
  if (filters.pipelineLeadsOnly) parts.push('Leads del pipeline')
  if (filters.contactStatuses.length > 0) parts.push(`Contacto: ${filters.contactStatuses.join(', ')}`)
  if (filters.dealStages.length > 0) parts.push(`Pipeline: ${filters.dealStages.join(', ')}`)
  if (filters.formIds.length > 0) parts.push(`Formulario: ${filters.formIds.join(', ')}`)
  if (filters.webinarIds.length > 0) parts.push(`Webinar: ${filters.webinarIds.join(', ')}`)
  if (filters.projectQuery) parts.push(`Proyecto: ${filters.projectQuery}`)

  return parts.length > 0 ? parts.join(', ') : 'Todos los contactos'
}
