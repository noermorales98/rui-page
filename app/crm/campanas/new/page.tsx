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
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/crm/campanas"
          className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-5 py-2.5 text-sm font-semibold text-[#080808] hover:bg-[#f7f8fa] transition"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>

      <div className="bg-[#f7f8fa] rounded-[28px] border border-[#e5e7eb] p-8">
        <CampaignWorkspace forms={forms} webinars={webinars} />
      </div>
    </div>
  )
}
