import { BadgeCheck, UserCheck, UserPlus, Upload, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { listContacts } from '@/lib/services/contacts'
import { listTags } from '@/lib/services/tags'
import { ContactsTable } from './_components/ContactsTable'
import { ContactFilters } from './_components/ContactFilters'
import { Card, MetricCard } from '@/app/crm/_components/ui'
import { buildContactMetrics } from './_lib/contact-metrics'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ q?: string; status?: string; source?: string; tag?: string; page?: string }>
}

export default async function ContactosPage({ searchParams }: Props) {
  const params = await searchParams

  const listResult = await listContacts({
    q: params.q,
    status: params.status,
    source: params.source,
    tag: params.tag,
    page: params.page,
    take: String(PAGE_SIZE),
  })

  const contacts = listResult.ok ? listResult.data.rows : []
  const total = listResult.ok ? listResult.data.total : 0
  const page = listResult.ok ? listResult.data.page : Math.max(1, Number(params.page ?? 1))
  const take = listResult.ok ? listResult.data.take : PAGE_SIZE
  const skip = (page - 1) * take

  const tagsResult = await listTags()
  const allTags = tagsResult.ok ? tagsResult.data : []

  const [overviewTotal, overviewByStatus] = await Promise.all([
    prisma.contact.count({ where: { deletedAt: null } }),
    prisma.contact.groupBy({
      by: ['status'],
      where: { deletedAt: null },
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
        <Link href="/crm/contactos/importar" className={TOK.actionSecondary}>
          <Upload size={16} strokeWidth={2} />
          Importar CSV
        </Link>
        <Link href="/crm/contactos/nuevo" className={TOK.actionPrimary}>
          <UserPlus size={16} strokeWidth={2} />
          Nuevo contacto
        </Link>
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
      {total > take && (
        <div className={`flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between ${TOK.textMuted}`}>
          <span>Mostrando {skip + 1}–{Math.min(skip + take, total)} de {total}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className={TOK.actionSecondary}>
                Anterior
              </a>
            )}
            {skip + take < total && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className={TOK.actionSecondary}>
                Siguiente
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
