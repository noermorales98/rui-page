import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listDealsGrouped, PIPELINE_STAGES } from '@/lib/services/deals'
import { PipelineBoard } from './_components/PipelineBoard'
import type { DealWithContact } from './_components/PipelineBoard'

export default async function PipelinePage() {
  const session = await auth()
  const role = session?.user?.role
  if (!role) redirect('/crm-login')

  const canMutate = role === 'ADMIN' || role === 'VENDEDOR'
  const canDelete = role === 'ADMIN'

  const result = await listDealsGrouped()
  if (!result.ok) {
    return (
      <div className="rounded-[28px] border border-[var(--color-outline-variant)] bg-[var(--color-error-container)] p-6 text-sm text-[var(--color-on-error-container)]">
        No se pudieron cargar las oportunidades: {result.error.message}
      </div>
    )
  }
  const grouped = result.data as Record<string, DealWithContact[]>

  return (
    <div className="flex flex-col gap-6">
      <PipelineBoard
        initialDeals={grouped}
        canMutate={canMutate}
        canDelete={canDelete}
        stages={PIPELINE_STAGES}
      />
    </div>
  )
}
