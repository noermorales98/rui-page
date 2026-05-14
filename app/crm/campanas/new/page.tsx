import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
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
        <Link href="/crm/campanas" className={TOK.linkBack}>
          <ArrowLeft size={16} strokeWidth={2} />
          Volver
        </Link>
      </div>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <CampaignWorkspace forms={forms} webinars={webinars} />
      </div>
    </div>
  )
}
