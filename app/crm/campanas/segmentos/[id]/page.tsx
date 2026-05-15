import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { SegmentForm } from '../_components/SegmentForm'
import { DeleteSegmentButton } from '../_components/DeleteSegmentButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SegmentDetailPage({ params }: Props) {
  const { id } = await params
  const segmentId = Number(id)
  if (!Number.isInteger(segmentId) || segmentId < 1) notFound()

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, deletedAt: null },
    select: { id: true, name: true, description: true, isDynamic: true, filters: true },
  })
  if (!segment) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/campanas/segmentos" className={TOK.linkBack}>
        <ArrowLeft size={16} />
        Segmentos
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">{segment.name}</h1>
        <DeleteSegmentButton segmentId={segment.id} />
      </div>
      <SegmentForm segment={segment} />
    </div>
  )
}
