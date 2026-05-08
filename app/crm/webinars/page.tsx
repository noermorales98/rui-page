import { prisma } from '@/lib/prisma'
import { WebinarTable } from './_components/WebinarTable'
import type { WebinarWithStats } from './_components/WebinarTable'

export default async function WebinarsPage() {
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
      <WebinarTable webinars={webinars as WebinarWithStats[]} />
    </div>
  )
}
