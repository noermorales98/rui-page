import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CampaignWorkspace } from '../_components/CampaignWorkspace'

export default async function NewCampaignPage() {
  const [forms, webinars] = await Promise.all([
    prisma.crmForm.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, status: true },
    }),
    prisma.webinar.findMany({
      orderBy: { date: 'desc' },
      select: { id: true, title: true, date: true },
    }),
  ])

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva campaña</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crea el mensaje, define la audiencia y guarda el borrador antes de enviarlo.
          </p>
        </div>
        <Link
          href="/crm/campanas"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>

      <CampaignWorkspace forms={forms} webinars={webinars} />
    </div>
  )
}
