import assert from 'node:assert/strict'
import test from 'node:test'
import { buildContactMetrics } from './contact-metrics'

test('buildContactMetrics returns the four contact overview cards in order', () => {
  const metrics = buildContactMetrics({
    total: 18,
    byStatus: {
      NEW: 7,
      QUALIFIED: 6,
      CLIENT: 5,
    },
  })

  assert.deepEqual(
    metrics.map(({ key, label, value, detail }) => ({ key, label, value, detail })),
    [
      { key: 'total', label: 'Contactos totales', value: '18', detail: 'Base completa del CRM' },
      { key: 'new', label: 'Nuevos leads', value: '7', detail: '39% del total' },
      { key: 'qualified', label: 'Calificados', value: '6', detail: '33% listos para seguimiento' },
      { key: 'clients', label: 'Clientes', value: '5', detail: '28% convertidos' },
    ],
  )
})

test('buildContactMetrics handles an empty contact database', () => {
  const metrics = buildContactMetrics({
    total: 0,
    byStatus: {},
  })

  assert.deepEqual(
    metrics.map(({ key, value, detail }) => ({ key, value, detail })),
    [
      { key: 'total', value: '0', detail: 'Base completa del CRM' },
      { key: 'new', value: '0', detail: 'Sin contactos todavia' },
      { key: 'qualified', value: '0', detail: 'Sin contactos todavia' },
      { key: 'clients', value: '0', detail: 'Sin contactos todavia' },
    ],
  )
})
