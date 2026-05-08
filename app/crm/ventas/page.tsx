import { prisma } from '@/lib/prisma'
import { calculateSalesSummary, formatMoneyFromCents } from './_lib/sales-metrics'
import { CreateSaleModal } from './_components/CreateSaleModal'
import { SalesFilters } from './_components/SalesFilters'
import { SalesTable } from './_components/SalesTable'
import type { SaleRow } from './_components/SalesTable'

const PAGE_SIZE = 50
const SALE_STATUSES = ['PENDING', 'PAID', 'REFUNDED', 'CANCELED'] as const
const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CARD', 'STRIPE', 'PAYPAL', 'OTHER'] as const

interface Props {
  searchParams: Promise<{
    q?: string
    status?: string
    method?: string
    page?: string
  }>
}

export default async function VentasPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const status = SALE_STATUSES.find((value) => value === params.status)
  const method = PAYMENT_METHODS.find((value) => value === params.method)
  const page = Math.max(1, Number(params.page ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    ...(q
      ? {
          OR: [
            { productName: { contains: q } },
            { contact: { name: { contains: q } } },
            { contact: { email: { contains: q } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(method ? { paymentMethod: method } : {}),
  }

  const [sales, total, summaryRows, deals] = await Promise.all([
    prisma.crmSale.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { soldAt: 'desc' },
      include: {
        contact: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, courseName: true, stage: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.crmSale.count({ where }),
    prisma.crmSale.findMany({
      where,
      select: { amountCents: true, status: true, soldAt: true },
    }),
    prisma.deal.findMany({
      where: { stage: { not: 'ENROLLED' } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: { contact: { select: { id: true, name: true, email: true } } },
    }),
  ])

  const summary = calculateSalesSummary(summaryRows)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra ventas, cierra oportunidades y mide ingresos del CRM.
          </p>
        </div>
        <CreateSaleModal deals={deals} />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ingresos pagados</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatMoneyFromCents(summary.paidRevenueCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{summary.paidCount} ventas pagadas</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ticket promedio</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatMoneyFromCents(summary.averagePaidTicketCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Solo ventas pagadas</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pendiente</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatMoneyFromCents(summary.pendingRevenueCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{summary.pendingCount} ventas pendientes</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Reembolsos</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{summary.refundedCount}</p>
          <p className="mt-1 text-xs text-gray-500">Ventas marcadas como reembolsadas</p>
        </div>
      </div>

      <SalesFilters />

      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <SalesTable sales={sales as SaleRow[]} />
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Anterior
              </a>
            )}
            {skip + PAGE_SIZE < total && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Siguiente
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
