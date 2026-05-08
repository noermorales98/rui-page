'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmPaymentMethod, CrmSaleStatus, DealStage } from '@prisma/client'
import { Trash2 } from 'lucide-react'
import { deleteSale, updateSaleStatus } from '../actions'
import { formatMoneyFromCents } from '../_lib/sales-metrics'

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

const STATUS_CLASSES: Record<CrmSaleStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-green-50 text-green-700',
  REFUNDED: 'bg-red-50 text-red-700',
  CANCELED: 'bg-gray-100 text-gray-600',
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
      <div className="px-6 py-12 text-center text-sm text-gray-500">
        No hay ventas que coincidan con los filtros.
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
          {message}
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Venta', 'Contacto', 'Monto', 'Estado', 'Metodo', 'Fecha', 'Acciones'].map((heading) => (
              <th
                key={heading}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sales.map((sale) => (
            <tr key={sale.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <p className="font-medium text-gray-900">{sale.productName}</p>
                <p className="mt-1 text-xs text-gray-400">
                  #{sale.id}
                  {sale.deal && ` · Pipeline #${sale.deal.id}`}
                </p>
              </td>
              <td className="px-6 py-4">
                <Link
                  href={`/crm/contactos/${sale.contact.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline"
                >
                  {sale.contact.name}
                </Link>
                <p className="mt-1 text-xs text-gray-500">{sale.contact.email}</p>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                {formatMoneyFromCents(sale.amountCents, sale.currency)}
              </td>
              <td className="px-6 py-4">
                <select
                  value={sale.status}
                  disabled={isPending}
                  onChange={(event) => handleStatusChange(sale.id, event.target.value as CrmSaleStatus)}
                  className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none ${STATUS_CLASSES[sale.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{METHOD_LABELS[sale.paymentMethod]}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{formatDate(sale.soldAt)}</td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(sale)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label="Eliminar venta"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
