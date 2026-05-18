'use client'

import { startTransition } from 'react'
import type { CommercialStatus, DealStage } from '@prisma/client'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import type { RegistrationRow } from '../_lib/seguimiento'
import { moveDealStage } from '../actions'

const STAGE_LABEL: Record<DealStage, string> = {
  LEAD: 'Lead',
  DEMO: 'Demo',
  NEGOTIATION: 'Negociación',
  ENROLLED: 'Cerrado',
}

const STAGES: DealStage[] = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED']

interface Props {
  row: RegistrationRow
  webinarId: number
  onClose: () => void
  onCommercialStatusChange: (registrationId: number, status: CommercialStatus) => void
  onOpenDealModal: (contactId: number, contactName: string) => void
  onOpenNoteModal: (contactId: number, contactName: string) => void
}

const itemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-container-low)] rounded-[var(--radius-sm)]'
const disabledItemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'
const dividerClass = 'my-1 border-t border-[var(--color-outline-variant)]'

export function RowActionsMenu({
  row,
  webinarId,
  onClose,
  onCommercialStatusChange,
  onOpenDealModal,
  onOpenNoteModal,
}: Props) {
  const { error: toastError } = useToast()
  const contact = row.contact
  const hasDeal = contact.deals.length > 0
  const currentDeal = contact.deals[0]

  function setCommercialStatus(status: CommercialStatus) {
    onCommercialStatusChange(row.id, status) // optimistic update + server action handled by SeguimientoTable
    onClose()
  }

  function handleMoveDeal(stage: DealStage) {
    if (!currentDeal) return
    onClose()
    startTransition(async () => {
      const result = await moveDealStage(currentDeal.id, stage, webinarId)
      if (result.error) toastError(result.error)
    })
  }

  return (
    <div className="flex flex-col p-1">
      {/* Ver contacto */}
      <a
        href={`/crm/contactos/${contact.id}`}
        className={itemClass}
        onClick={onClose}
      >
        <span>👁</span> Ver contacto
      </a>

      {/* Crear oportunidad / pipeline */}
      {!hasDeal ? (
        <button
          type="button"
          className={itemClass}
          onClick={() => { onOpenDealModal(contact.id, contact.name); onClose() }}
        >
          <span>💼</span> Crear oportunidad
        </button>
      ) : (
        <div>
          <div className={`${itemClass} cursor-default opacity-60`}>
            <span>💼</span> Oportunidad: {STAGE_LABEL[currentDeal.stage]}
          </div>
          <div className="pl-4">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                className={`${itemClass} text-xs`}
                onClick={() => handleMoveDeal(stage)}
                disabled={currentDeal.stage === stage}
              >
                → {STAGE_LABEL[stage]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={dividerClass} />

      {/* Estados comerciales */}
      <button type="button" className={itemClass} onClick={() => setCommercialStatus('CONTACTADO')}>
        <span>✅</span> Marcar como contactado
      </button>
      <button type="button" className={itemClass} onClick={() => setCommercialStatus('INTERESADO')}>
        <span>⭐</span> Marcar como interesado
      </button>
      <button type="button" className={itemClass} onClick={() => setCommercialStatus('NO_RESPONDE')}>
        <span>🔇</span> Marcar como no responde
      </button>

      <div className={dividerClass} />

      {/* Comunicación */}
      {contact.phone ? (
        <a
          href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
          onClick={onClose}
        >
          <span>💬</span> Enviar WhatsApp
        </a>
      ) : (
        <span className={disabledItemClass} title="Sin teléfono registrado">
          <span>💬</span> Enviar WhatsApp
        </span>
      )}
      <a href={`mailto:${contact.email}`} className={itemClass} onClick={onClose}>
        <span>📧</span> Enviar email
      </a>

      <div className={dividerClass} />

      {/* Notas / Tareas */}
      <button type="button" className={itemClass} onClick={() => { onOpenNoteModal(contact.id, contact.name); onClose() }}>
        <span>📝</span> Registrar nota
      </button>
      <span className={disabledItemClass} title="Próximamente — requiere módulo de Tareas">
        <span>📌</span> Crear tarea
      </span>
    </div>
  )
}
