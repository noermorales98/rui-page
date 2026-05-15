import assert from 'node:assert/strict'
import test from 'node:test'

import { canPublishFunnel, normalizeCategoryNames } from '@/lib/funnels/rules'
import { createWebinarFunnelSchema } from '@/lib/validators/funnels'

test('normalizeCategoryNames trims, deduplicates and caps category input', () => {
  assert.deepEqual(normalizeCategoryNames(' Webinar,  Lead Magnet, webinar, , Curso '), [
    'Webinar',
    'Lead Magnet',
    'Curso',
  ])
})

test('createWebinarFunnelSchema requires a valid webinar date', () => {
  const parsed = createWebinarFunnelSchema.safeParse({
    name: 'Metodo',
    slug: 'metodo',
    webinarTitle: 'Metodo',
    webinarDate: 'not-a-date',
    categories: 'Webinar',
  })

  assert.equal(parsed.success, false)
})

test('canPublishFunnel requires the four webinar pages', () => {
  const result = canPublishFunnel([
    { key: 'registration' },
    { key: 'thank_you' },
    { key: 'access' },
  ])

  assert.deepEqual(result, {
    ok: false,
    error: 'Falta la pagina Sala antes de publicar.',
  })
})
