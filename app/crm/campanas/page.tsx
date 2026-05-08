import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getMissingSmtpConfig } from '@/lib/mailer'
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
      <div className="flex justify-end">
        <Link
          href="/crm/campanas/new"
          className="inline-flex items-center gap-2 bg-[#080808] text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-[#222] transition"
        >
          <Plus size={16} />
          Crear campaña
        </Link>
      </div>

      {missingSmtpConfig.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configura {missingSmtpConfig.join(', ')} para habilitar el envío real de campañas.
        </div>
      )}

      <div className="bg-[#f7f8fa] rounded-[28px] border border-[#e5e7eb] p-6">
        <CampaignsTable campaigns={campaigns as CampaignRow[]} smtpReady={missingSmtpConfig.length === 0} />
      </div>
    </div>
  )
}
