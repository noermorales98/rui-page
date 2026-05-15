import { notFound } from 'next/navigation'
import { getFunnelForStudio, listFunnelAutomations } from '@/lib/services/funnels'
import { FunnelStudio } from '../_components/FunnelStudio'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; page?: string }>
}

export default async function FunnelStudioPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const funnelId = Number(id)
  if (!Number.isInteger(funnelId)) notFound()

  const [funnel, automations] = await Promise.all([
    getFunnelForStudio(funnelId),
    listFunnelAutomations(funnelId),
  ])
  if (!funnel) notFound()

  return (
    <FunnelStudio
      funnel={funnel}
      automations={automations}
      tab={query.tab}
      pageId={query.page}
    />
  )
}
