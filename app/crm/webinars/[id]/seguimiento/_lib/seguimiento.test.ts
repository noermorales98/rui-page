import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calcLeadScore,
  applyFilter,
  calcMetrics,
  type RegistrationRow,
} from './seguimiento'

function makeRow(overrides: Partial<RegistrationRow> = {}): RegistrationRow {
  return {
    id: 1,
    status: 'REGISTERED',
    commercialStatus: 'SIN_CONTACTAR',
    createdAt: new Date(),
    contactId: 10,
    registrationCount: 1,
    registrationDates: [],
    contact: {
      id: 10,
      name: 'Ana',
      email: 'ana@test.com',
      phone: null,
      activities: [],
      deals: [],
    },
    ...overrides,
  }
}

// calcLeadScore
test('PURCHASED → CALIENTE', () => {
  assert.equal(calcLeadScore(makeRow({ status: 'PURCHASED' })), 'CALIENTE')
})

test('ATTENDED + INTERESADO → CALIENTE', () => {
  assert.equal(
    calcLeadScore(makeRow({ status: 'ATTENDED', commercialStatus: 'INTERESADO' })),
    'CALIENTE',
  )
})

test('ATTENDED + PLAN_PAGOS → CALIENTE', () => {
  assert.equal(
    calcLeadScore(makeRow({ status: 'ATTENDED', commercialStatus: 'PLAN_PAGOS' })),
    'CALIENTE',
  )
})

test('NO_RESPONDE → FRIO', () => {
  assert.equal(calcLeadScore(makeRow({ commercialStatus: 'NO_RESPONDE' })), 'FRIO')
})

test('DESCARTADO → FRIO', () => {
  assert.equal(calcLeadScore(makeRow({ commercialStatus: 'DESCARTADO' })), 'FRIO')
})

test('ATTENDED sin estado especial → TIBIO', () => {
  assert.equal(calcLeadScore(makeRow({ status: 'ATTENDED' })), 'TIBIO')
})

test('REGISTERED sin estado especial → TIBIO', () => {
  assert.equal(calcLeadScore(makeRow()), 'TIBIO')
})

// applyFilter
test('filter todos devuelve todos', () => {
  const rows = [makeRow({ status: 'REGISTERED' }), makeRow({ id: 2, status: 'ATTENDED' })]
  assert.equal(applyFilter(rows, 'todos').length, 2)
})

test('filter asistieron incluye ATTENDED y PURCHASED', () => {
  const rows = [
    makeRow({ status: 'REGISTERED' }),
    makeRow({ id: 2, status: 'ATTENDED' }),
    makeRow({ id: 3, status: 'PURCHASED' }),
  ]
  const result = applyFilter(rows, 'asistieron')
  assert.equal(result.length, 2)
  assert.ok(result.every((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED'))
})

test('filter sin_contactar', () => {
  const rows = [
    makeRow({ commercialStatus: 'SIN_CONTACTAR' }),
    makeRow({ id: 2, commercialStatus: 'CONTACTADO' }),
  ]
  const result = applyFilter(rows, 'sin_contactar')
  assert.equal(result.length, 1)
  assert.equal(result[0].commercialStatus, 'SIN_CONTACTAR')
})

test('filter caliente', () => {
  const rows = [
    makeRow({ status: 'PURCHASED' }),
    makeRow({ id: 2, status: 'REGISTERED' }),
  ]
  const result = applyFilter(rows, 'caliente')
  assert.equal(result.length, 1)
})

// calcMetrics
test('calcMetrics cuenta correctamente', () => {
  const rows = [
    makeRow({ status: 'REGISTERED' }),
    makeRow({ id: 2, status: 'ATTENDED' }),
    makeRow({ id: 3, status: 'PURCHASED', contact: { id: 30, name: 'C', email: 'c@t.com', phone: null, activities: [], deals: [{ id: 1, stage: 'ENROLLED', courseName: null, sales: [{ amountCents: 50000 }] }] } }),
  ]
  const m = calcMetrics(rows)
  assert.equal(m.total, 3)
  assert.equal(m.attended, 2)
  assert.equal(m.notAttended, 1)
  assert.equal(m.purchased, 1)
  assert.equal(m.revenueCents, 50000)
  assert.equal(m.hotLeads, 1)
  assert.equal(m.conversionPct, 50)
})
