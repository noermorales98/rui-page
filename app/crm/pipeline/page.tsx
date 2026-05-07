import { prisma } from '@/lib/prisma'
import type { DealStage } from '@prisma/client'
import { PipelineBoard } from './_components/PipelineBoard'
import type { DealWithContact } from './_components/PipelineBoard'

const STAGES: DealStage[] = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED']

export default async function PipelinePage() {
  const deals = await prisma.deal.findMany({
    include: {
      contact: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const grouped = STAGES.reduce<Record<DealStage, DealWithContact[]>>(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage)
      return acc
    },
    {} as Record<DealStage, DealWithContact[]>,
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="mt-1 text-sm text-gray-500">Seguimiento de oportunidades de venta</p>
      </div>
      <PipelineBoard initialDeals={grouped} />
    </div>
  )
}
