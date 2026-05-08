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
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Email marketing segmentado por contactos registrados, leads, formularios, webinars y proyecto.
          </p>
        </div>
        <Link
          href="/crm/campanas/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={16} />
          Crear campaña
        </Link>
      </div>

      {missingSmtpConfig.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configura {missingSmtpConfig.join(', ')} para habilitar el envío real de campañas.
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <CampaignsTable campaigns={campaigns as CampaignRow[]} smtpReady={missingSmtpConfig.length === 0} />
      </div>
    </div>
  )
}
