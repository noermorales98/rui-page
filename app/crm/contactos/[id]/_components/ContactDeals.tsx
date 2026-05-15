import { prisma } from '@/lib/prisma'
import type { DealStage } from '@prisma/client'
import { NewDealButton } from './NewDealButton'

const STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead',
  DEMO: 'Demo / Llamada',
  NEGOTIATION: 'Negociación',
  ENROLLED: 'Inscrito',
}

const STAGE_BADGE: Record<DealStage, string> = {
  LEAD: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]',
  DEMO: 'bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]',
  NEGOTIATION: 'bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed-variant)]',
  ENROLLED: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]',
}

interface Props {
  contactId: number
  contactName: string
}

export async function ContactDeals({ contactId, contactName }: Props) {
  const deals = await prisma.deal.findMany({
    where: { contactId },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">Oportunidades</h3>
        <NewDealButton contactId={contactId} contactName={contactName} />
      </div>
      {deals.length === 0 ? (
        <p className="text-sm text-[var(--color-on-surface-variant)]">Sin oportunidades registradas</p>
      ) : (
        <ul className="space-y-2">
          {deals.map((deal) => (
            <li
              key={deal.id}
              className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--color-surface-container-low)] px-3 py-2"
            >
              <span className="text-sm font-medium text-[var(--color-on-surface)]">
                {deal.courseName || <span className="italic text-[var(--color-on-surface-variant)]">sin curso</span>}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_BADGE[deal.stage]}`}
              >
                {STAGE_LABELS[deal.stage]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
