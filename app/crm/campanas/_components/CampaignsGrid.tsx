import Link from 'next/link'
import type { CrmCampaignStatus } from '@prisma/client'
import { CampaignStatusBadge } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type CampaignRow = {
  id: number
  name: string
  subject: string
  status: CrmCampaignStatus
  audienceLabel: string
  recipientCount: number
  sentCount: number
  failedCount: number
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy: { name: string } | null
}

function formatDate(value: Date | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function CampaignsGrid({ campaigns }: { campaigns: CampaignRow[] }) {
  if (campaigns.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textStrong}>Sin campañas</p>
        <p className={`mt-1 ${TOK.textMuted}`}>Crea un borrador y envíalo a tus contactos segmentados.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="flex flex-col gap-3 rounded-2xl border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-container-lowest)] p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${TOK.textStrong}`}>{campaign.name}</p>
              <p className={`mt-0.5 truncate text-xs ${TOK.textMuted}`}>{campaign.subject}</p>
            </div>
            <CampaignStatusBadge status={campaign.status} />
          </div>

          <p className={`truncate text-xs ${TOK.textSubtle}`}>{campaign.audienceLabel}</p>

          <div className={`flex items-center gap-4 text-xs ${TOK.textMuted}`}>
            <span>{campaign.sentCount}/{campaign.recipientCount} enviados</span>
            {campaign.failedCount > 0 && (
              <span className="text-[var(--color-error)]">{campaign.failedCount} fallidos</span>
            )}
          </div>

          <p className={`text-xs ${TOK.textSubtle}`}>
            {campaign.sentAt
              ? `Enviado ${formatDate(campaign.sentAt)}`
              : `Creado ${formatDate(campaign.createdAt)}`}
          </p>
        </div>
      ))}
    </div>
  )
}
