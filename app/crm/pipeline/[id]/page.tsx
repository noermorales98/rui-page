import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getDeal } from '@/lib/services/deals'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { Accordion, DealStageBadge, ContactStatusBadge } from '@/app/crm/_components/ui'
import { DealTimeline, type TimelineEntry } from './_components/DealTimeline'

interface Props {
  params: Promise<{ id: string }>
}

const moneyFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params
  const dealId = Number(id)
  if (!Number.isInteger(dealId) || dealId < 1) notFound()

  const dealResult = await getDeal(dealId)
  if (!dealResult.ok) notFound()
  const deal = dealResult.data

  // Timeline = AuditLog rows for this deal + ContactActivity rows for the linked
  // contact (so stage moves logged as NOTE on the contact also show here).
  // No service yet — two parallel prisma reads, merged + sorted in memory.
  const DEAL_MOVE_SNIPPET = 'Deal movido'

  const [auditRows, noteActivitiesRaw] = await Promise.all([
    prisma.auditLog.findMany({
      where: { entityType: 'Deal', entityId: dealId },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    // Sin `contains` en SQL: mezcla utf8mb4_bin (columna) vs unicode_ci (literal) rompe LIKE en MySQL.
    prisma.contactActivity.findMany({
      where: {
        contactId: deal.contactId,
        type: 'NOTE',
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 120,
    }),
  ])

  const activityRows = noteActivitiesRaw
    .filter((row) => row.body != null && row.body.includes(DEAL_MOVE_SNIPPET))
    .slice(0, 50)

  const entries: TimelineEntry[] = [
    ...auditRows.map((row) => ({ kind: 'audit' as const, row })),
    ...activityRows.map((row) => ({ kind: 'activity' as const, row })),
  ].sort(
    (a, b) =>
      new Date(b.row.createdAt).getTime() - new Date(a.row.createdAt).getTime(),
  )

  const paidSales = deal.sales.filter((s) => s.status === 'PAID')
  const paidTotal = paidSales.reduce((acc, s) => acc + s.amountCents, 0)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/pipeline" className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Volver al pipeline
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad} flex flex-col gap-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-on-surface-variant)]">Deal</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--color-on-surface)]">
              {deal.courseName ?? '(Sin curso definido)'}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
              Creado el {dateFmt.format(new Date(deal.createdAt))} · Actualizado {dateFmt.format(new Date(deal.updatedAt))}
            </p>
          </div>
          <DealStageBadge stage={deal.stage} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-4">
            <p className={TOK.label}>Contacto</p>
            <Link
              href={`/crm/contactos/${deal.contact.id}`}
              className="block text-sm font-semibold text-[var(--color-on-surface)] hover:underline"
            >
              {deal.contact.name}
            </Link>
            <p className="text-sm text-[var(--color-on-surface-variant)]">{deal.contact.email}</p>
            {deal.contact.phone && (
              <p className="text-sm text-[var(--color-on-surface-variant)]">{deal.contact.phone}</p>
            )}
            <div className="mt-2"><ContactStatusBadge status={deal.contact.status} /></div>
          </div>

          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-4">
            <Accordion title="Ventas vinculadas" defaultOpen>
              {deal.sales.length === 0 ? (
                <p className="text-sm text-[var(--color-on-surface-variant)]">Ninguna venta registrada.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {deal.sales.map((sale) => (
                    <li key={sale.id} className="flex items-center justify-between gap-3">
                      <span className="truncate">{sale.productName}</span>
                      <span className="whitespace-nowrap font-mono text-xs text-[var(--color-on-surface-variant)]">
                        {moneyFmt.format(sale.amountCents / 100)} · {sale.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {paidSales.length > 0 && (
                <p className="mt-3 text-xs text-[var(--color-on-surface-variant)]">
                  Pagado: <strong>{moneyFmt.format(paidTotal / 100)}</strong>
                </p>
              )}
            </Accordion>
          </div>
        </div>

        {deal.notes && (
          <Accordion title="Notas">
            <p className="whitespace-pre-wrap text-sm text-[var(--color-on-surface)]">{deal.notes}</p>
          </Accordion>
        )}
      </div>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <Accordion title="Línea de tiempo" defaultOpen>
          <DealTimeline entries={entries} />
        </Accordion>
      </div>
    </div>
  )
}
