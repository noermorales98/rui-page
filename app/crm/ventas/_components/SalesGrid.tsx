import Link from 'next/link'
import type { CrmPaymentMethod, CrmSaleStatus, DealStage } from '@prisma/client'
import { SaleStatusBadge } from '@/app/crm/_components/ui'
import { formatMoneyFromCents } from '../_lib/sales-metrics'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type SaleRow = {
  id: number
  productName: string
  amountCents: number
  currency: string
  status: CrmSaleStatus
  paymentMethod: CrmPaymentMethod
  soldAt: Date
  notes: string | null
  contact: { id: number; name: string; email: string }
  deal: { id: number; courseName: string | null; stage: DealStage } | null
  createdBy: { name: string } | null
}

const METHOD_LABELS: Record<CrmPaymentMethod, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia', CARD: 'Tarjeta',
  STRIPE: 'Stripe', PAYPAL: 'PayPal', OTHER: 'Otro',
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function SalesGrid({ sales }: { sales: SaleRow[] }) {
  if (sales.length === 0) {
    return (
      <div className={`py-12 text-center ${TOK.textMuted}`}>No hay ventas que coincidan con los filtros.</div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sales.map((sale) => (
        <div
          key={sale.id}
          className="flex flex-col gap-3 rounded-2xl border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-container-lowest)] p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${TOK.textStrong}`}>{sale.productName}</p>
              <p className={`mt-0.5 text-xs ${TOK.textSubtle}`}>#{sale.id}</p>
            </div>
            <SaleStatusBadge status={sale.status} />
          </div>

          <p className={`text-lg font-semibold ${TOK.textStrong}`}>
            {formatMoneyFromCents(sale.amountCents, sale.currency)}
          </p>

          <div className={`flex items-center gap-2 text-xs ${TOK.textMuted}`}>
            <Link
              href={`/crm/contactos/${sale.contact.id}`}
              className={TOK.linkAccent}
              onClick={(e) => e.stopPropagation()}
            >
              {sale.contact.name}
            </Link>
          </div>

          <div className={`flex items-center justify-between text-xs ${TOK.textSubtle}`}>
            <span>{METHOD_LABELS[sale.paymentMethod]}</span>
            <span>{formatDate(sale.soldAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
