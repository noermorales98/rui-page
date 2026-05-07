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
  LEAD: 'bg-indigo-100 text-indigo-800',
  DEMO: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  ENROLLED: 'bg-green-100 text-green-800',
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
    <div className="mt-6 border-t border-gray-100 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Oportunidades</h3>
        <NewDealButton contactId={contactId} contactName={contactName} />
      </div>
      {deals.length === 0 ? (
        <p className="text-sm text-gray-400">Sin oportunidades registradas</p>
      ) : (
        <ul className="space-y-2">
          {deals.map((deal) => (
            <li
              key={deal.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-gray-900">
                {deal.courseName || <span className="italic text-gray-400">sin curso</span>}
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
