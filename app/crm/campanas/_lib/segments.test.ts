import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCampaignContactWhere, formatCampaignAudience, normalizeCampaignFilters } from './segments'

test('normalizes filters from form data into a stable campaign segment', () => {
  const formData = new FormData()
  formData.append('audience', 'registered')
  formData.append('audience', 'pipeline_leads')
  formData.append('contactStatuses', 'NEW')
  formData.append('contactStatuses', 'CLIENT')
  formData.append('dealStages', 'LEAD')
  formData.append('formIds', '12')
  formData.append('formIds', 'bad')
  formData.append('webinarIds', '7')
  formData.append('projectQuery', 'Metodo')

  assert.deepEqual(normalizeCampaignFilters(formData), {
    registeredOnly: true,
    pipelineLeadsOnly: true,
    contactStatuses: ['NEW', 'CLIENT'],
    dealStages: ['LEAD'],
    formIds: [12],
    webinarIds: [7],
    projectQuery: 'Metodo',
  })
})

test('builds an indexed Prisma contact where clause for campaign filters', () => {
  const where = buildCampaignContactWhere({
    registeredOnly: true,
    pipelineLeadsOnly: true,
    contactStatuses: ['NEW'],
    dealStages: ['LEAD', 'DEMO'],
    formIds: [2],
    webinarIds: [5],
    projectQuery: 'angeles',
  })

  assert.deepEqual(where, {
    AND: [
      { status: { in: ['NEW'] } },
      {
        OR: [
          { source: { in: ['FORM', 'WEBINAR'] } },
          { formSubmissions: { some: {} } },
          { registrations: { some: {} } },
          { status: 'NEW' },
          { deals: { some: { stage: 'LEAD' } } },
        ],
      },
      { deals: { some: { stage: { in: ['LEAD', 'DEMO'] } } } },
      { formSubmissions: { some: { formId: { in: [2] } } } },
      { registrations: { some: { webinarId: { in: [5] } } } },
      { deals: { some: { courseName: { contains: 'angeles' } } } },
    ],
  })
})

test('formats audience summaries without leaking empty filters', () => {
  assert.equal(
    formatCampaignAudience({
      registeredOnly: true,
      pipelineLeadsOnly: false,
      contactStatuses: ['QUALIFIED'],
      dealStages: [],
      formIds: [],
      webinarIds: [3],
      projectQuery: '',
    }),
    'Registrados, Contacto: QUALIFIED, Webinar: 3',
  )
})
