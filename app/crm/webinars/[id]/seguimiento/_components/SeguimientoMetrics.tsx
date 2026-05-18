import { TOK } from '@/app/crm/_lib/ui-tokens'
import type { SeguimientoMetrics as Metrics } from '../_lib/seguimiento'

function formatMXN(cents: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(cents / 100)
}

const card = 'rounded-[24px] bg-[var(--color-surface-container-low)] p-5 text-center min-w-[100px]'

interface Props { metrics: Metrics }

export function SeguimientoMetrics({ metrics }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-primary)]">{metrics.total}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Registrados</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-secondary)]">{metrics.attended}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Asistentes</div>
      </div>
      <div className={card}>
        <div className={`text-2xl font-bold ${TOK.textSubtle}`}>{metrics.notAttended}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>No asistieron</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-tertiary)]">{metrics.purchased}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Compradores</div>
      </div>
      <div className={card}>
        <div className={`text-2xl font-bold ${TOK.textSubtle}`}>{metrics.conversionPct}%</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Conv. asist→venta</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-primary)]">{formatMXN(metrics.revenueCents)}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Ingresos aprox.</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-tertiary)]">{metrics.hotLeads}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Leads calientes</div>
      </div>
    </div>
  )
}
