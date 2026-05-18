'use client'

import { useState, startTransition } from 'react'
import { ModalWrapper } from '@/app/crm/_components/ui/ModalWrapper'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { createDealForContact } from '../actions'

interface Props {
  contactId: number
  contactName: string
  webinarId: number
  onClose: () => void
}

export function CreateDealModal({ contactId, contactName, webinarId, onClose }: Props) {
  const [courseName, setCourseName] = useState('')
  const [loading, setLoading] = useState(false)
  const { error: toastError, success: toastSuccess } = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    startTransition(async () => {
      const result = await createDealForContact(contactId, courseName, webinarId)
      setLoading(false)
      if (result.error) {
        toastError(result.error)
      } else {
        toastSuccess('Oportunidad creada')
        onClose()
      }
    })
  }

  return (
    <ModalWrapper title={`Nueva oportunidad — ${contactName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={TOK.label}>Nombre del curso / producto</label>
          <input
            className={TOK.inputNative}
            placeholder="Ej. Curso de inversión"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            autoFocus
          />
        </div>
        <p className={`text-xs ${TOK.textSubtle}`}>
          Se creará en etapa <strong>Lead</strong>. Puedes moverla desde el pipeline.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={TOK.actionSecondary}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className={TOK.actionPrimary}>
            {loading ? 'Creando…' : 'Crear oportunidad'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}
