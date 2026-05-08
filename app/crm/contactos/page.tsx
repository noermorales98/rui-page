import { BadgeCheck, UserCheck, UserPlus, UsersRound } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ContactsTable } from './_components/ContactsTable'
import { ContactFilters } from './_components/ContactFilters'
import { CreateContactModal } from './_components/CreateContactModal'
import { ImportCsvModal } from './_components/ImportCsvModal'
import { Card, MetricCard } from '@/app/crm/_components/ui'
import { buildContactMetrics } from './_lib/contact-metrics'

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ q?: string; status?: string; source?: string; tag?: string; page?: string }>
}

export default async function ContactosPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const status = params.status ?? ''
  const source = params.source ?? ''
  const tagId = params.tag ? Number(params.tag) : undefined
  const page = Math.max(1, Number(params.page ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    ...(status ? { status: status as 'NEW' | 'QUALIFIED' | 'CLIENT' } : {}),
    ...(source ? { source: source as 'WEBINAR' | 'FORM' | 'MANUAL' | 'IMPORT' } : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
  }

  const [contacts, total, allTags, overviewTotal, overviewByStatus] = await Promise.all([
    prisma.contact.findMany({
      where, skip, take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.contact.count({ where }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    prisma.contact.count(),
    prisma.contact.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const contactMetrics = buildContactMetrics({
    total: overviewTotal,
    byStatus: Object.fromEntries(
      overviewByStatus.map((row) => [row.status, row._count._all]),
    ),
  })

  const metricIcons = {
    total: <UsersRound size={20} strokeWidth={1.7} />,
    new: <UserPlus size={20} strokeWidth={1.7} />,
    qualified: <BadgeCheck size={20} strokeWidth={1.7} />,
    clients: <UserCheck size={20} strokeWidth={1.7} />,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-end gap-2">
        <ImportCsvModal />
        <CreateContactModal tags={allTags} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {contactMetrics.map((metric) => (
          <MetricCard
            key={metric.key}
            accent={metric.accent}
            icon={metricIcons[metric.key]}
            value={metric.value}
            label={metric.label}
            detail={metric.detail}
          />
        ))}
      </div>

      {/* Filters */}
      <ContactFilters tags={allTags} />

      {/* Table card */}
      <Card>
        <ContactsTable contacts={contacts} />
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex flex-col gap-3 text-sm text-[#8a8a8a] sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#080808] transition hover:bg-[#f2f2f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]">
                Anterior
              </a>
            )}
            {skip + PAGE_SIZE < total && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#080808] transition hover:bg-[#f2f2f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]">
                Siguiente
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
