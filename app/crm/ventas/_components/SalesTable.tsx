'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmPaymentMethod, CrmSaleStatus, DealStage } from '@prisma/client'
import { Trash2 } from 'lucide-react'
import { deleteSale, updateSaleStatus } from '../actions'
import { formatMoneyFromCents } from '../_lib/sales-metrics'
import { SaleStatusBadge } from '@/app/crm/_components/ui'

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

const STATUS_LABELS: Record<CrmSaleStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  REFUNDED: 'Reembolsada',
  CANCELED: 'Cancelada',
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

  function handleStatusChange(saleId: number, status: CrmSaleStatus) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateSaleStatus(saleId, status)
      if (result.error) setMessage(result.error)
    })
  }

  function handleDelete(sale: SaleRow) {
    if (!window.confirm(`¿Eliminar la venta de "${sale.productName}"?`)) return

    setMessage(null)
    startTransition(async () => {
      const result = await deleteSale(sale.id)
      if (result.error) setMessage(result.error)
    })
  }

  if (sales.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#8a8a8a]">No hay ventas que coincidan con los filtros.</div>
    )
  }

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}

      {/* Column headers */}
      <div
        className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
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
          className="grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0"
          style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.5fr' }}
        >
          {/* Venta */}
          <div>
            <p className="text-sm font-medium text-[#080808]">{sale.productName}</p>
            <p className="mt-0.5 text-xs text-[#8a8a8a]">
              #{sale.id}
              {sale.deal && ` · Pipeline #${sale.deal.id}`}
            </p>
          </div>

          {/* Contacto */}
          <div>
            <Link
              href={`/crm/contactos/${sale.contact.id}`}
              className="text-sm font-medium text-[#080808] hover:text-[#5a5a5a] hover:underline"
            >
              {sale.contact.name}
            </Link>
            <p className="mt-0.5 text-xs text-[#8a8a8a]">{sale.contact.email}</p>
          </div>

          {/* Monto */}
          <div className="text-sm font-semibold text-[#080808]">
            {formatMoneyFromCents(sale.amountCents, sale.currency)}
          </div>

          {/* Estado */}
          <div>
            <SaleStatusBadge status={sale.status} />
          </div>

          {/* Método / Fecha */}
          <div>
            <p className="text-sm text-[#5a5a5a]">{METHOD_LABELS[sale.paymentMethod]}</p>
            <p className="mt-0.5 text-xs text-[#8a8a8a]">{formatDate(sale.soldAt)}</p>
          </div>

          {/* Acciones */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDelete(sale)}
              className="rounded-xl p-1.5 text-[#8a8a8a] hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors border-none bg-transparent cursor-pointer"
              aria-label="Eliminar venta"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
