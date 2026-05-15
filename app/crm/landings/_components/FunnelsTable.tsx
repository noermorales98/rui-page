'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { FunnelStatus } from '@prisma/client'
import { setStatusAction } from '../actions'
import { categoryLabel } from '../_lib/view-model'
import { Badge, Button } from '@/app/crm/_components/ui'

type FunnelRow = {
  id: number
  name: string
  slug: string
  type: string
  status: FunnelStatus
  updatedAt: Date | string
  webinar: { title: string; date: Date | string } | null
  pages: Array<{ id: number }>
  categories: Array<{ category: { name: string } }>
}

const STATUS_LABEL: Record<FunnelStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

export function FunnelsTable({ funnels }: { funnels: FunnelRow[] }) {
  if (funnels.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] px-6 py-12 text-center">
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">Todavia no hay funnels.</p>
        <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Crea tu primer webinar funnel para publicar sus paginas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {funnels.map((funnel) => (
        <FunnelRow key={funnel.id} funnel={funnel} />
      ))}
    </div>
  )
}

function FunnelRow({ funnel }: { funnel: FunnelRow }) {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function setStatus(status: FunnelStatus) {
    setMessage(null)
    startTransition(async () => {
      const result = await setStatusAction(funnel.id, status)
      setMessage(result.error ?? null)
    })
  }

  return (
    <div className="grid gap-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-4 lg:grid-cols-[1.8fr_1fr_1fr_.9fr_auto] lg:items-center">
      <div>
        <Link href={`/crm/landings/${funnel.id}`} className="font-semibold text-[var(--color-on-surface)] hover:underline">
          {funnel.name}
        </Link>
        <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">/f/{funnel.slug}</p>
        {message && <p className="mt-1 text-xs text-[var(--color-error)]">{message}</p>}
      </div>
      <div className="text-sm text-[var(--color-on-surface-variant)]">
        {categoryLabel(funnel.categories)}
      </div>
      <div className="text-sm text-[var(--color-on-surface-variant)]">
        {funnel.webinar?.title ?? 'General'}
      </div>
      <div>
        <Badge variant={funnel.status === 'PUBLISHED' ? 'lime' : funnel.status === 'ARCHIVED' ? 'gray' : 'amber'}>
          {STATUS_LABEL[funnel.status]}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Link href={`/crm/landings/${funnel.id}`} className="inline-flex">
          <Button type="button" variant="secondary" size="sm">Studio</Button>
        </Link>
        {funnel.status !== 'PUBLISHED' && (
          <Button type="button" size="sm" disabled={pending} onClick={() => setStatus('PUBLISHED')}>Publicar</Button>
        )}
        {funnel.status === 'PUBLISHED' && (
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setStatus('DRAFT')}>Borrador</Button>
        )}
      </div>
    </div>
  )
}
