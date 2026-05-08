type ContactStatus = 'NEW' | 'QUALIFIED' | 'CLIENT'

export interface ContactMetricInput {
  total: number
  byStatus: Partial<Record<ContactStatus, number>>
}

export interface ContactMetric {
  key: 'total' | 'new' | 'qualified' | 'clients'
  label: string
  value: string
  detail: string
  accent?: boolean
}

function percent(count: number, total: number): string {
  if (total === 0) return 'Sin contactos todavia'
  return `${Math.round((count / total) * 100)}%`
}

export function buildContactMetrics({ total, byStatus }: ContactMetricInput): ContactMetric[] {
  const newCount = byStatus.NEW ?? 0
  const qualifiedCount = byStatus.QUALIFIED ?? 0
  const clientCount = byStatus.CLIENT ?? 0

  return [
    {
      key: 'total',
      label: 'Contactos totales',
      value: String(total),
      detail: 'Base completa del CRM',
      accent: true,
    },
    {
      key: 'new',
      label: 'Nuevos leads',
      value: String(newCount),
      detail: total === 0 ? percent(newCount, total) : `${percent(newCount, total)} del total`,
    },
    {
      key: 'qualified',
      label: 'Calificados',
      value: String(qualifiedCount),
      detail: total === 0 ? percent(qualifiedCount, total) : `${percent(qualifiedCount, total)} listos para seguimiento`,
    },
    {
      key: 'clients',
      label: 'Clientes',
      value: String(clientCount),
      detail: total === 0 ? percent(clientCount, total) : `${percent(clientCount, total)} convertidos`,
    },
  ]
}
