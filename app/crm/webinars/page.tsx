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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webinars</h1>
        <p className="mt-1 text-sm text-gray-500">Gestión de eventos y participantes</p>
      </div>
      <WebinarTable webinars={webinars as WebinarWithStats[]} />
    </div>
  )
}
