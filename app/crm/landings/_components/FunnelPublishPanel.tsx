'use client'

import { useState, useTransition } from 'react'
import type { FunnelStatus } from '@prisma/client'
import { setStatusAction } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type PublishFunnel = {
  id: number
  name: string
  slug: string
  status: FunnelStatus
}

export function FunnelPublishPanel({ funnel }: { funnel: PublishFunnel }) {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function setStatus(status: FunnelStatus) {
    setMessage(null)
    startTransition(async () => {
      const result = await setStatusAction(funnel.id, status)
      setMessage(result.error ?? 'Estado actualizado.')
    })
  }

  return (
    <div className={`${TOK.panel} ${TOK.panelPad}`}>
      <h2 className={TOK.sectionTitle}>Publicacion</h2>
      <p className={`mt-1 ${TOK.sectionSubtitle}`}>URL principal: /f/{funnel.slug}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => setStatus('PUBLISHED')}>Publicar</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => setStatus('DRAFT')}>Volver a borrador</Button>
        <Button type="button" variant="danger" disabled={pending} onClick={() => setStatus('ARCHIVED')}>Archivar</Button>
      </div>
      {message && <p className="mt-4 text-sm text-[var(--color-on-surface-variant)]">{message}</p>}
    </div>
  )
}
