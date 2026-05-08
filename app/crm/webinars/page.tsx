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
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Webinars</h1>
        <p className="mt-1.5 text-sm text-[#8a8a8a]">Gestión de eventos y participantes</p>
      </div>
      <WebinarTable webinars={webinars as WebinarWithStats[]} />
    </div>
  )
}
