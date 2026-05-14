import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getMissingSmtpConfig } from '@/lib/mailer'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { CampaignsTable } from './_components/CampaignsTable'
import type { CampaignRow } from './_components/CampaignsTable'

export default async function CampanasPage() {
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
        <Link href="/crm/campanas/new" className={TOK.actionPrimary}>
          <Plus size={16} strokeWidth={2} />
          Crear campaña
        </Link>
      </div>

      {missingSmtpConfig.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configura {missingSmtpConfig.join(', ')} para habilitar el envío real de campañas.
        </div>
      )}

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <CampaignsTable campaigns={campaigns as CampaignRow[]} smtpReady={missingSmtpConfig.length === 0} />
      </div>
    </div>
  )
}
