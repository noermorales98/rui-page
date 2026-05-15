import { redirect } from 'next/navigation'
import type { DealStage } from '@prisma/client'
import { auth } from '@/auth'
import { listDealsGrouped } from '@/lib/services/deals'
import { PIPELINE_STAGES } from '@/lib/validators/deals'
import { ViewToggle, type ListView } from '@/app/crm/_components/ui'
import { PipelineBoard } from './_components/PipelineBoard'
import type { DealWithContact } from './_components/PipelineBoard'
import { PipelineDealsTable } from './_components/PipelineDealsTable'
import { CreateDealButton } from './_components/CreateDealButton'

function flattenDeals(
  grouped: Record<string, DealWithContact[]>,
  stages: DealStage[],
): DealWithContact[] {
  const out: DealWithContact[] = []
  for (const s of stages) {
    out.push(...(grouped[s] ?? []))
  }
  return out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function PipelinePage({ searchParams }: Props) {
  const params = await searchParams
  const view: ListView = params.view === 'cards' ? 'cards' : 'table'

  const session = await auth()
  const role = session?.user?.role
  if (!role) redirect('/crm-login')

  const canMutate = role === 'ADMIN' || role === 'VENDEDOR'
  const canDelete = role === 'ADMIN'

  const result = await listDealsGrouped()
  if (!result.ok) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-error-container)] p-6 text-sm text-[var(--color-on-error-container)]">
        No se pudieron cargar las oportunidades: {result.error.message}
      </div>
    )
  }
  const grouped = result.data as Record<string, DealWithContact[]>
  const flatDeals = flattenDeals(grouped, PIPELINE_STAGES)

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-6 px-4 pb-10 pt-1 sm:px-6">
      <div className="flex flex-wrap justify-end gap-2">
        <ViewToggle view={view} searchParams={params} />
        {canMutate ? <CreateDealButton /> : null}
      </div>
      {view === 'cards' ? (
        <PipelineBoard
          initialDeals={grouped}
          canMutate={canMutate}
          canDelete={canDelete}
          stages={PIPELINE_STAGES}
        />
      ) : (
        <PipelineDealsTable deals={flatDeals} canMutate={canMutate} canDelete={canDelete} />
      )}
    </div>
  )
}
