import { prisma } from '@/lib/prisma'
import { WebinarTable } from './_components/WebinarTable'
import { WebinarGrid } from './_components/WebinarGrid'
import { ViewToggle } from '@/app/crm/_components/ui'
import type { WebinarWithStats } from './_components/WebinarTable'

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function WebinarsPage({ searchParams }: Props) {
  const params = await searchParams
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
        <ViewToggle current={params.view === 'cards' ? 'cards' : 'list'} searchParams={params} />
      </div>
      {params.view === 'cards' ? (
        <WebinarGrid webinars={webinars as WebinarWithStats[]} />
      ) : (
        <WebinarTable webinars={webinars as WebinarWithStats[]} />
      )}
    </div>
  )
}
