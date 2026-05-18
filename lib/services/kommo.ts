// lib/services/kommo.ts

export type KommoConfig = {
  pipelineId: number
  statusId: number
  emailFieldId: number | null
  phoneFieldId: number | null
}

export type KommoLeadInput = {
  contactName: string | undefined
  email: string | undefined
  phone: string | undefined
  formSlug: string
  formName: string
}

let configCache: KommoConfig | null = null

async function fetchKommoJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Kommo fetch ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

export async function getKommoConfig(baseUrl: string, token: string): Promise<KommoConfig> {
  if (configCache) return configCache

  type Pipeline = { id: number; _embedded: { statuses: Array<{ id: number }> } }
  type PipelinesResponse = { _embedded: { pipelines: Pipeline[] } }
  const pipelinesData = await fetchKommoJson<PipelinesResponse>(
    `${baseUrl}/api/v4/pipelines`,
    token,
  )
  const pipeline = pipelinesData._embedded.pipelines[0]
  if (!pipeline) throw new Error('Kommo: no pipelines found')
  const pipelineId = pipeline.id
  const statusId = pipeline._embedded.statuses[0]?.id
  if (!statusId) throw new Error('Kommo: no statuses in pipeline')

  type CustomField = { id: number; field_code?: string; field_type?: string }
  type FieldsResponse = { _embedded: { custom_fields: CustomField[] } }
  const fieldsData = await fetchKommoJson<FieldsResponse>(
    `${baseUrl}/api/v4/contacts/custom_fields`,
    token,
  )
  const fields = fieldsData._embedded.custom_fields
  const emailField = fields.find((f) => f.field_code === 'EMAIL' || f.field_type === 'EMAIL')
  const phoneField = fields.find((f) => f.field_code === 'PHONE' || f.field_type === 'PHONE')

  configCache = {
    pipelineId,
    statusId,
    emailFieldId: emailField?.id ?? null,
    phoneFieldId: phoneField?.id ?? null,
  }
  return configCache
}

export function buildLeadPayload(input: KommoLeadInput, config: KommoConfig): object[] {
  const name = input.contactName ?? 'Sin nombre'
  const customFields: Array<{
    field_id: number
    values: Array<{ value: string; enum_code: string }>
  }> = []

  if (config.emailFieldId && input.email) {
    customFields.push({
      field_id: config.emailFieldId,
      values: [{ value: input.email, enum_code: 'WORK' }],
    })
  }
  if (config.phoneFieldId && input.phone) {
    customFields.push({
      field_id: config.phoneFieldId,
      values: [{ value: input.phone, enum_code: 'WORK' }],
    })
  }

  return [
    {
      name: `Form: ${input.formName} — ${name}`,
      pipeline_id: config.pipelineId,
      status_id: config.statusId,
      _embedded: {
        contacts: [{ name, custom_fields_values: customFields }],
        tags: [{ name: input.formSlug }],
      },
    },
  ]
}

export async function createKommoLead(input: KommoLeadInput): Promise<void> {
  const baseUrl = process.env.KOMMO_BASE_URL
  const token = process.env.KOMMO_LONG_TOKEN
  if (!baseUrl || !token) return

  const config = await getKommoConfig(baseUrl, token)
  const payload = buildLeadPayload(input, config)

  const res = await fetch(`${baseUrl}/api/v4/leads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Kommo API ${res.status}`)
}
