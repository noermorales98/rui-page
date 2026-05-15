import { prisma } from '@/lib/prisma'
import { ViewToggle, type ListView } from '@/app/crm/_components/ui'
import { WebinarTable } from './_components/WebinarTable'
import type { WebinarWithStats } from './_components/WebinarTable'

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function WebinarsPage({ searchParams }: Props) {
  const params = await searchParams
  const view: ListView = params.view === 'cards' ? 'cards' : 'table'
  const webinars = await prisma.webinar.findMany({
    orderBy: { date: 'desc' },
    include: {
      registrations: {
        select: { status: true },
      },
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <ViewToggle view={view} searchParams={params} />
      </div>
      <WebinarTable webinars={webinars as WebinarWithStats[]} view={view} />
    </div>
  )
}
