import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getMissingSmtpConfig } from '@/lib/mailer'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { ViewToggle, type ListView } from '@/app/crm/_components/ui'
import { CampaignsTable } from './_components/CampaignsTable'
import { CampaignsGrid } from './_components/CampaignsGrid'
import type { CampaignRow } from './_components/CampaignsTable'

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function CampanasPage({ searchParams }: Props) {
  const params = await searchParams
  const view: ListView = params.view === 'cards' ? 'cards' : 'table'
  const campaigns = await prisma.crmCampaign.findMany({
    where: { status: { not: 'ARCHIVED' } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      name: true,
      subject: true,
      status: true,
      audienceLabel: true,
      recipientCount: true,
      sentCount: true,
      failedCount: true,
      sentAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
    },
  })

  const missingSmtpConfig = getMissingSmtpConfig()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Campañas</h1>
          <p className={`mt-1.5 ${TOK.sectionSubtitle}`}>
            Email marketing segmentado por contactos, leads, webinars y formularios.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ViewToggle view={view} searchParams={params} />
          <Link href="/crm/campanas/new" className={TOK.actionPrimary}>
            <Plus size={16} strokeWidth={2} />
            Crear campaña
          </Link>
        </div>
      </div>

      {missingSmtpConfig.length > 0 && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-secondary-fixed)] px-4 py-3 text-sm text-[var(--color-on-secondary-fixed-variant)]">
          Configura {missingSmtpConfig.join(', ')} para habilitar el envío real de campañas.
        </div>
      )}

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <CampaignsTable campaigns={campaigns as CampaignRow[]} smtpReady={missingSmtpConfig.length === 0} view={view} />
      </div>
    </div>
  )
}
