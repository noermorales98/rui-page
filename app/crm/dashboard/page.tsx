import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  DollarSign,
  FileText,
  GitBranch,
  Mail,
  UsersRound,
  Video,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Card, MetricCard } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { formatMoneyFromCents } from '../ventas/_lib/sales-metrics'

const CONTACT_STATUS_LABELS = {
  NEW: 'Nuevos',
  QUALIFIED: 'Calificados',
  CLIENT: 'Clientes',
} as const

const CONTACT_SOURCE_LABELS = {
  WEBINAR: 'Webinar',
  FORM: 'Formulario',
  MANUAL: 'Manual',
  IMPORT: 'Importado',
} as const

const DEAL_STAGE_LABELS = {
  LEAD: 'Lead',
  DEMO: 'Demo',
  NEGOTIATION: 'Negociacion',
  ENROLLED: 'Inscrito',
} as const

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date, offset = 0) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date)
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function percent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

type ChartPoint = {
  label: string
  value: number
  detail?: string
}

function MiniBarChart({ data, formatter = compactNumber }: { data: ChartPoint[]; formatter?: (value: number) => string }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="flex h-64 items-end gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] p-4">
      {data.map((item) => {
        const height = Math.max(8, Math.round((item.value / max) * 100))

        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-full bg-[var(--color-surface-container-lowest)]">
              <div
                className="w-full rounded-full bg-[var(--color-secondary-container)]"
                style={{ height: `${height}%` }}
                aria-label={`${item.label}: ${formatter(item.value)}`}
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase text-[var(--color-on-surface-variant)]">{item.label}</p>
              <p className="mt-0.5 text-xs font-semibold text-[var(--color-on-surface)]">{formatter(item.value)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBars({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="space-y-px">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[var(--color-on-surface)]">{item.label}</span>
            <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">{item.detail ?? item.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-container-lowest)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary-fixed)]"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              aria-label={`${item.label}: ${item.value}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function SectionSummaryCard({
  href,
  icon,
  title,
  description,
  value,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  value: string
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[132px] flex-col justify-between rounded-[24px] bg-[var(--color-surface-container-lowest)] p-4 transition hover:bg-[var(--color-surface-container-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)]">
          {icon}
        </span>
        <ArrowRight size={16} className="text-[var(--color-on-surface-variant)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-on-surface)]" />
      </div>
      <div>
        <p className="text-lg font-semibold text-[var(--color-on-surface)]">{value}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-on-surface)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-on-surface-variant)]">{description}</p>
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const now = new Date()
  const today = startOfDay(now)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const firstTrendMonth = startOfMonth(now, -5)
  const nextMonth = startOfMonth(now, 1)

  const [
    contactsTotal,
    contactsLast30,
    contactsByStatus,
    contactsBySource,
    dealsByStage,
    salesRows,
    upcomingWebinars,
    webinarRegistrations,
    formsTotal,
    publishedForms,
    formSubmissions,
    formSubmissionsLast30,
    campaigns,
    recentActivities,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.contact.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.contact.groupBy({ by: ['source'], _count: { _all: true } }),
    prisma.deal.groupBy({ by: ['stage'], _count: { _all: true } }),
    prisma.crmSale.findMany({
      where: { soldAt: { gte: firstTrendMonth, lt: nextMonth } },
      select: { amountCents: true, status: true, soldAt: true },
    }),
    prisma.webinar.count({ where: { date: { gte: now } } }),
    prisma.webinarRegistration.count(),
    prisma.crmForm.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.crmForm.count({ where: { status: 'PUBLISHED' } }),
    prisma.crmFormSubmission.count(),
    prisma.crmFormSubmission.count({ where: { submittedAt: { gte: thirtyDaysAgo } } }),
    prisma.crmCampaign.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: {
        status: true,
        recipientCount: true,
        sentCount: true,
        failedCount: true,
      },
    }),
    prisma.contactActivity.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: { select: { id: true, name: true } },
      },
    }),
  ])

  const contactStatusCounts = Object.fromEntries(
    contactsByStatus.map((row) => [row.status, row._count._all]),
  ) as Partial<Record<keyof typeof CONTACT_STATUS_LABELS, number>>

  const contactSourceCounts = Object.fromEntries(
    contactsBySource.map((row) => [row.source, row._count._all]),
  ) as Partial<Record<keyof typeof CONTACT_SOURCE_LABELS, number>>

  const dealStageCounts = Object.fromEntries(
    dealsByStage.map((row) => [row.stage, row._count._all]),
  ) as Partial<Record<keyof typeof DEAL_STAGE_LABELS, number>>

  const openDeals = (dealStageCounts.LEAD ?? 0) + (dealStageCounts.DEMO ?? 0) + (dealStageCounts.NEGOTIATION ?? 0)
  const paidSales = salesRows.filter((sale) => sale.status === 'PAID')
  const paidRevenueCents = paidSales.reduce((total, sale) => total + sale.amountCents, 0)
  const pendingRevenueCents = salesRows
    .filter((sale) => sale.status === 'PENDING')
    .reduce((total, sale) => total + sale.amountCents, 0)

  const sentCampaigns = campaigns.filter((campaign) => campaign.status === 'SENT' || campaign.status === 'PARTIAL').length
  const draftCampaigns = campaigns.filter((campaign) => campaign.status === 'DRAFT').length
  const recipientsReached = sum(campaigns.map((campaign) => campaign.sentCount))
  const campaignFailures = sum(campaigns.map((campaign) => campaign.failedCount))

  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const month = startOfMonth(now, index - 5)
    const monthEnd = startOfMonth(month, 1)
    const value = paidSales
      .filter((sale) => sale.soldAt >= month && sale.soldAt < monthEnd)
      .reduce((total, sale) => total + sale.amountCents, 0)

    return {
      label: formatMonth(month),
      value,
    }
  })

  const pipelineData = (Object.keys(DEAL_STAGE_LABELS) as Array<keyof typeof DEAL_STAGE_LABELS>).map((stage) => ({
    label: DEAL_STAGE_LABELS[stage],
    value: dealStageCounts[stage] ?? 0,
    detail: `${dealStageCounts[stage] ?? 0} oportunidades`,
  }))

  const contactData = (Object.keys(CONTACT_STATUS_LABELS) as Array<keyof typeof CONTACT_STATUS_LABELS>).map((status) => {
    const value = contactStatusCounts[status] ?? 0

    return {
      label: CONTACT_STATUS_LABELS[status],
      value,
      detail: `${percent(value, contactsTotal)}%`,
    }
  })

  const sourceData = (Object.keys(CONTACT_SOURCE_LABELS) as Array<keyof typeof CONTACT_SOURCE_LABELS>).map((source) => {
    const value = contactSourceCounts[source] ?? 0

    return {
      label: CONTACT_SOURCE_LABELS[source],
      value,
      detail: `${value} contactos`,
    }
  })

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          accent
          icon={<UsersRound size={20} strokeWidth={1.7} />}
          value={compactNumber(contactsTotal)}
          label="Contactos"
          detail={`${contactsLast30} nuevos en 30 dias`}
        />
        <MetricCard
          icon={<DollarSign size={20} strokeWidth={1.7} />}
          value={formatMoneyFromCents(paidRevenueCents)}
          label="Ingresos pagados"
          detail={`${paidSales.length} ventas en los ultimos 6 meses`}
        />
        <MetricCard
          icon={<GitBranch size={20} strokeWidth={1.7} />}
          value={openDeals}
          label="Pipeline abierto"
          detail={`${dealStageCounts.ENROLLED ?? 0} oportunidades inscritas`}
        />
        <MetricCard
          icon={<Video size={20} strokeWidth={1.7} />}
          value={upcomingWebinars}
          label="Webinars proximos"
          detail={`${webinarRegistrations} registros acumulados`}
        />
        <MetricCard
          icon={<FileText size={20} strokeWidth={1.7} />}
          value={formSubmissions}
          label="Respuestas de formularios"
          detail={`${formSubmissionsLast30} recibidas en 30 dias`}
        />
        <MetricCard
          icon={<Mail size={20} strokeWidth={1.7} />}
          value={recipientsReached}
          label="Emails enviados"
          detail={`${sentCampaigns} campanas enviadas · ${draftCampaigns} borradores`}
        />
      </div>

      <div className="grid gap-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={TOK.sectionTitle}>Ingresos pagados</h2>
              <p className={TOK.sectionSubtitle}>Ventas pagadas de los ultimos 6 meses.</p>
            </div>
            <span className="rounded-full bg-[var(--color-surface-container-lowest)] px-3 py-1.5 text-xs font-semibold text-[var(--color-on-surface)]">
              Pendiente: {formatMoneyFromCents(pendingRevenueCents)}
            </span>
          </div>
          <MiniBarChart data={monthlyRevenue} formatter={(value) => formatMoneyFromCents(value)} />
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)]">
              <BarChart3 size={18} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className={TOK.sectionTitle}>Pipeline</h2>
              <p className={TOK.sectionSubtitle}>Distribucion por etapa.</p>
            </div>
          </div>
          <HorizontalBars data={pipelineData} />
        </Card>
      </div>

      <div className="grid gap-2 xl:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)]">
              <UsersRound size={18} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className={TOK.sectionTitle}>Estado de contactos</h2>
              <p className={TOK.sectionSubtitle}>De lead nuevo a cliente.</p>
            </div>
          </div>
          <HorizontalBars data={contactData} />
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)]">
              <Activity size={18} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className={TOK.sectionTitle}>Origen de contactos</h2>
              <p className={TOK.sectionSubtitle}>Canales que alimentan la base.</p>
            </div>
          </div>
          <HorizontalBars data={sourceData} />
        </Card>
      </div>

      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <h2 className={TOK.sectionTitle}>Resumen por seccion</h2>
              <p className={TOK.sectionSubtitle}>Accesos rapidos a las areas principales.</p>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <SectionSummaryCard
              href="/crm/contactos"
              icon={<UsersRound size={17} strokeWidth={1.8} />}
              title="Contactos"
              description="Base, tags, fuentes y seguimiento."
              value={`${contactsTotal} registros`}
            />
            <SectionSummaryCard
              href="/crm/pipeline"
              icon={<GitBranch size={17} strokeWidth={1.8} />}
              title="Pipeline"
              description="Oportunidades por etapa comercial."
              value={`${openDeals} abiertas`}
            />
            <SectionSummaryCard
              href="/crm/ventas"
              icon={<DollarSign size={17} strokeWidth={1.8} />}
              title="Ventas"
              description="Pagos, pendientes y ticket promedio."
              value={formatMoneyFromCents(paidRevenueCents)}
            />
            <SectionSummaryCard
              href="/crm/webinars"
              icon={<CalendarClock size={17} strokeWidth={1.8} />}
              title="Webinars"
              description="Eventos, asistencia y compras."
              value={`${upcomingWebinars} proximos`}
            />
            <SectionSummaryCard
              href="/crm/formularios"
              icon={<FileText size={17} strokeWidth={1.8} />}
              title="Formularios"
              description="Captura de leads y respuestas."
              value={`${publishedForms}/${formsTotal} activos`}
            />
            <SectionSummaryCard
              href="/crm/campanas"
              icon={<Mail size={17} strokeWidth={1.8} />}
              title="Campanas"
              description="Audiencias, envios y fallos."
              value={`${campaignFailures} fallos`}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)]">
              <Activity size={18} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className={TOK.sectionTitle}>Actividad reciente</h2>
              <p className={TOK.sectionSubtitle}>Ultimos movimientos registrados.</p>
            </div>
          </div>
          <div className="space-y-px">
            {recentActivities.length === 0 ? (
              <p className={`rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-6 text-center ${TOK.textMuted}`}>
                Todavia no hay actividad registrada.
              </p>
            ) : (
              recentActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/crm/contactos/${activity.contactId}`}
                  className="block rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-3 transition hover:bg-[var(--color-surface-container-high)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
                >
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">{activity.contact.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-on-surface-variant)]">
                    {activity.body || activity.type.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
