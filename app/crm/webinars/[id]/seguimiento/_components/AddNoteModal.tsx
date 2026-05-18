'use client'

import { useState, startTransition } from 'react'
import { ModalWrapper } from '@/app/crm/_components/ui/ModalWrapper'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { addNoteToContact } from '../actions'

interface Props {
  contactId: number
  contactName: string
  webinarId: number
  onClose: () => void
}

export function AddNoteModal({ contactId, contactName, webinarId, onClose }: Props) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const { error: toastError, success: toastSuccess } = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    startTransition(async () => {
      const result = await addNoteToContact(contactId, body, webinarId)
      setLoading(false)
      if (result.error) {
        toastError(result.error)
      } else {
        toastSuccess('Nota registrada')
        onClose()
      }
    })
  }

  return (
    <ModalWrapper title={`Nota — ${contactName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={TOK.label}>Nota</label>
          <textarea
            className={`${TOK.inputNativeMultiline} min-h-[100px]`}
            placeholder="Escribe aquí tu nota…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={TOK.actionSecondary}>
            Cancelar
          </button>
          <button type="submit" disabled={loading || !body.trim()} className={TOK.actionPrimary}>
            {loading ? 'Guardando…' : 'Guardar nota'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}
