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
    <div className="flex flex-col gap-6">
      <PipelineBoard initialDeals={grouped} />
    </div>
  )
}
