import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateSalesSummary, normalizeMoneyInput } from './sales-metrics'

test('normalizeMoneyInput converts MXN-style text to cents', () => {
  assert.equal(normalizeMoneyInput('$1,250.90'), 125090)
  assert.equal(normalizeMoneyInput(' 99 '), 9900)
  assert.equal(normalizeMoneyInput(''), null)
  assert.equal(normalizeMoneyInput('abc'), null)
})

test('calculateSalesSummary totals paid sales and keeps pending separate', () => {
  const summary = calculateSalesSummary([
    { amountCents: 120000, status: 'PAID', soldAt: new Date('2026-05-02T10:00:00Z') },
    { amountCents: 30000, status: 'PENDING', soldAt: new Date('2026-05-03T10:00:00Z') },
    { amountCents: 45000, status: 'PAID', soldAt: new Date('2026-05-04T10:00:00Z') },
    { amountCents: 20000, status: 'REFUNDED', soldAt: new Date('2026-05-05T10:00:00Z') },
  ])

  assert.deepEqual(summary, {
    paidRevenueCents: 165000,
    pendingRevenueCents: 30000,
    paidCount: 2,
    pendingCount: 1,
    refundedCount: 1,
    averagePaidTicketCents: 82500,
  })
})
