'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmPaymentMethod, CrmSaleStatus, DealStage } from '@prisma/client'
import { Trash2 } from 'lucide-react'
import { deleteSale } from '../actions'
import { formatMoneyFromCents } from '../_lib/sales-metrics'
import { SaleStatusBadge, Dialog, type ListView } from '@/app/crm/_components/ui'
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
  view?: ListView
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

export function SalesTable({ sales, view = 'table' }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saleToDelete, setSaleToDelete] = useState<SaleRow | null>(null)

  function handleDelete(sale: SaleRow) {
    setSaleToDelete(sale)
  }

  function doDelete() {
    if (!saleToDelete) return
    const sale = saleToDelete
    setSaleToDelete(null)
    setMessage(null)
    startTransition(async () => {
      if (!saleToDelete) return
      const result = await deleteSale(saleToDelete.id)
      if (result.error) setMessage(result.error)
    })
  }

  return (
    <>
      <Dialog
        open={saleToDelete !== null}
        title="¿Eliminar venta?"
        description={saleToDelete ? `Eliminar la venta de "${saleToDelete.productName}".` : undefined}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={doDelete}
        onCancel={() => setSaleToDelete(null)}
      />
      {sales.length === 0 ? (
        <div className={`py-12 text-center ${TOK.textMuted}`}>No hay ventas que coincidan con los filtros.</div>
      ) : view === 'cards' ? (
        <div>
          {message && (
            <div className={TOK.errorBox}>{message}</div>
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex min-h-48 flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-5 transition hover:bg-[var(--color-surface-container-low)]"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-on-surface)]">{sale.productName}</p>
                      <p className={`mt-1 text-xs ${TOK.textSubtle}`}>#{sale.id}{sale.deal && ` · Pipeline #${sale.deal.id}`}</p>
                    </div>
                    <SaleStatusBadge status={sale.status} />
                  </div>
                  <Link
                    href={`/crm/contactos/${sale.contact.id}`}
                    className="mt-4 block truncate text-sm font-semibold text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
                  >
                    {sale.contact.name}
                  </Link>
                  <p className={`mt-1 truncate text-xs ${TOK.textSubtle}`}>{sale.contact.email}</p>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                      {formatMoneyFromCents(sale.amountCents, sale.currency)}
                    </p>
                    <p className={`mt-1 text-xs ${TOK.textSubtle}`}>{METHOD_LABELS[sale.paymentMethod]} · {formatDate(sale.soldAt)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(sale)}
                    className="cursor-pointer rounded-[var(--radius-sm)] border-none bg-transparent p-2 text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] disabled:opacity-50"
                    aria-label="Eliminar venta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div>
      {message && (
        <div className={TOK.errorBox}>{message}</div>
      )}

      {/* Column headers */}
      <div
        className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.5fr] px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] ${TOK.textSubtle}`}
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
          className="mb-1.5 grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.5fr] items-center rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-3 transition last:mb-0 hover:bg-[var(--color-surface-container-low)]"
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
      )}
    </>
  )
}
