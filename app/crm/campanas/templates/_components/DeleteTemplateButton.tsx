'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteTemplate } from '../../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function DeleteTemplateButton({ templateId }: { templateId: number }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar esta plantilla?')) return
    startTransition(async () => {
      await deleteTemplate(templateId)
      router.push('/crm/campanas/templates')
    })
  }

  return (
    <button type="button" disabled={pending} onClick={handleDelete} className={TOK.actionSecondary}>
      <Trash2 size={15} />
      {pending ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
