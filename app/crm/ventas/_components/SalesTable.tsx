'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmPaymentMethod, CrmSaleStatus, DealStage } from '@prisma/client'
import { Trash2 } from 'lucide-react'
import { deleteSale } from '../actions'
import { formatMoneyFromCents } from '../_lib/sales-metrics'
import { Dialog, SaleStatusBadge } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export type SaleRow = {
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

type Props = {
  sales: SaleRow[]
}

const METHOD_LABELS: Record<CrmPaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  STRIPE: 'Stripe',
  PAYPAL: 'PayPal',
  OTHER: 'Otro',
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function SalesTable({ sales }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saleToDelete, setSaleToDelete] = useState<SaleRow | null>(null)

  function handleDelete(sale: SaleRow) {
    setSaleToDelete(sale)
  }

  function doDelete() {
    setSaleToDelete(null)
    setMessage(null)
    startTransition(async () => {
      if (!saleToDelete) return
      const result = await deleteSale(saleToDelete.id)
      if (result.error) setMessage(result.error)
    })
  }

  if (sales.length === 0) {
    return (
      <div className={`py-12 text-center ${TOK.textMuted}`}>No hay ventas que coincidan con los filtros.</div>
    )
  }

  return (
    <>
      <Dialog
        open={saleToDelete !== null}
        title="¿Eliminar venta?"
        description={`Eliminar la venta de "${saleToDelete?.productName}".`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={doDelete}
        onCancel={() => setSaleToDelete(null)}
      />
      <div>
      {message && (
        <div className={TOK.errorBox}>{message}</div>
      )}

      {/* Column headers */}
      <div
        className={`grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] ${TOK.textSubtle}`}
        style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.5fr' }}
      >
        <span>Venta</span>
        <span>Contacto</span>
        <span>Monto</span>
        <span>Estado</span>
        <span>Método / Fecha</span>
        <span></span>
      </div>

      {/* Rows */}
      {sales.map((sale) => (
        <div
          key={sale.id}
          className="mb-1.5 grid items-center rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-3 last:mb-0"
          style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.5fr' }}
        >
          {/* Venta */}
          <div>
            <p className="text-sm font-medium text-[var(--color-on-surface)]">{sale.productName}</p>
            <p className={`mt-0.5 text-xs ${TOK.textSubtle}`}>
              #{sale.id}
              {sale.deal && ` · Pipeline #${sale.deal.id}`}
            </p>
          </div>

          {/* Contacto */}
          <div>
            <Link
              href={`/crm/contactos/${sale.contact.id}`}
              className="text-sm font-medium text-[var(--color-on-surface)] transition-colors hover:text-[var(--color-primary)] hover:underline"
            >
              {sale.contact.name}
            </Link>
            <p className={`mt-0.5 text-xs ${TOK.textSubtle}`}>{sale.contact.email}</p>
          </div>

          {/* Monto */}
          <div className="text-sm font-semibold text-[var(--color-on-surface)]">
            {formatMoneyFromCents(sale.amountCents, sale.currency)}
          </div>

          {/* Estado */}
          <div>
            <SaleStatusBadge status={sale.status} />
          </div>

          {/* Método / Fecha */}
          <div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">{METHOD_LABELS[sale.paymentMethod]}</p>
            <p className={`mt-0.5 text-xs ${TOK.textSubtle}`}>{formatDate(sale.soldAt)}</p>
          </div>

          {/* Acciones */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDelete(sale)}
              className="cursor-pointer rounded-xl border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] disabled:opacity-50"
              aria-label="Eliminar venta"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
    </>
  )
}
