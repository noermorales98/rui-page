import { prisma } from '@/lib/prisma'
import { calculateSalesSummary, formatMoneyFromCents } from './_lib/sales-metrics'
import { CreateSaleModal } from './_components/CreateSaleModal'
import { SalesFilters } from './_components/SalesFilters'
import { SalesTable } from './_components/SalesTable'
import { MetricCard } from '@/app/crm/_components/ui'
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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Ventas</h1>
          <p className="mt-1.5 text-sm text-[#8a8a8a]">
            Registra ventas, cierra oportunidades y mide ingresos del CRM.
          </p>
        </div>
        <CreateSaleModal deals={deals} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          accent
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" />
              <path d="M14.71 10.06C14.61 9.3 13.74 8.07 12.16 8.07C10.33 8.07 9.56 9.08 9.41 9.59C9.16 10.26 9.21 11.66 11.35 11.81C14.04 12 15.11 12.32 14.97 13.96C14.84 15.6 13.34 15.95 12.16 15.91C10.98 15.88 9.05 15.33 8.97 13.87M11.97 7V8.07M11.97 15.9V17" strokeLinecap="round" />
            </svg>
          }
          value={formatMoneyFromCents(summary.paidRevenueCents)}
          label={`Ingresos pagados · ${summary.paidCount} ventas`}
        />
        <MetricCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" />
              <path d="M7 12L10.5 15.5L17 8.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          value={formatMoneyFromCents(summary.averagePaidTicketCents)}
          label="Ticket promedio · solo pagadas"
        />
        <MetricCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
              <path d="M12 8V12L14 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          value={formatMoneyFromCents(summary.pendingRevenueCents)}
          label={`Pendiente · ${summary.pendingCount} ventas`}
        />
        <MetricCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
              <path d="M15 9L9 15M9 9L15 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          value={summary.refundedCount}
          label="Reembolsos · ventas marcadas"
        />
      </div>

      <SalesFilters />

      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        <SalesTable sales={sales as SaleRow[]} />
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[#8a8a8a]">
          <span>
            Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="bg-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm"
              >
                Anterior
              </a>
            )}
            {skip + PAGE_SIZE < total && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="bg-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm"
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
