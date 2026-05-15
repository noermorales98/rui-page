'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteSegment } from '../../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function DeleteSegmentButton({ segmentId }: { segmentId: number }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar este segmento?')) return
    startTransition(async () => {
      await deleteSegment(segmentId)
      router.push('/crm/campanas/segmentos')
    })
  }

  return (
    <button type="button" disabled={pending} onClick={handleDelete} className={TOK.actionSecondary}>
      <Trash2 size={15} />
      {pending ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
