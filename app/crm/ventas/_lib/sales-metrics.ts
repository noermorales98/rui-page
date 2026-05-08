export type SaleMetricRow = {
  amountCents: number
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELED'
  soldAt: Date
}

export function normalizeMoneyInput(value: string) {
  const normalized = value.replace(/[$,\s]/g, '')
  if (!normalized) return null

  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) return null

  return Math.round(amount * 100)
}

export function formatMoneyFromCents(cents: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function calculateSalesSummary(sales: SaleMetricRow[]) {
  const paid = sales.filter((sale) => sale.status === 'PAID')
  const pending = sales.filter((sale) => sale.status === 'PENDING')
  const refunded = sales.filter((sale) => sale.status === 'REFUNDED')
  const paidRevenueCents = paid.reduce((sum, sale) => sum + sale.amountCents, 0)
  const pendingRevenueCents = pending.reduce((sum, sale) => sum + sale.amountCents, 0)

  return {
    paidRevenueCents,
    pendingRevenueCents,
    paidCount: paid.length,
    pendingCount: pending.length,
    refundedCount: refunded.length,
    averagePaidTicketCents: paid.length > 0 ? Math.round(paidRevenueCents / paid.length) : 0,
  }
}
