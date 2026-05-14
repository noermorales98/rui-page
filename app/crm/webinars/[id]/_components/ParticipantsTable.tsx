'use client'

import { useState, startTransition } from 'react'
import type { RegistrationStatus } from '@prisma/client'
import { updateRegistrationStatus, removeRegistration } from '../../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { Dialog, useToast } from '@/app/crm/_components/ui'

export type RegistrationWithContact = {
  id: number
  status: RegistrationStatus
  createdAt: Date | string
  contactId: number
  contact: { id: number; name: string; email: string }
}

const STATUS_OPTIONS: { value: RegistrationStatus; label: string; colorClass: string }[] = [
  {
    value: 'REGISTERED',
    label: 'Registrado',
    colorClass: 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]',
  },
  {
    value: 'ATTENDED',
    label: 'Asistió',
    colorClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]',
  },
  {
    value: 'PURCHASED',
    label: 'Compró',
    colorClass: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]',
  },
]

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

interface Props {
  registrations: RegistrationWithContact[]
}

export function ParticipantsTable({ registrations }: Props) {
  const [statuses, setStatuses] = useState<Record<number, RegistrationStatus>>(
    Object.fromEntries(registrations.map((r) => [r.id, r.status])),
  )
  const [regToRemove, setRegToRemove] = useState<RegistrationWithContact | null>(null)
  const { error: toastError } = useToast()

  function handleStatusChange(registrationId: number, status: RegistrationStatus) {
    setStatuses((prev) => ({ ...prev, [registrationId]: status }))
    startTransition(async () => {
      const result = await updateRegistrationStatus(registrationId, status)
      if (result?.error) {
        // Revert optimistic update on error
        setStatuses((prev) => ({ ...prev, [registrationId]: registrations.find(r => r.id === registrationId)?.status ?? status }))
      }
    })
  }

  function handleRemove(reg: RegistrationWithContact) {
    setRegToRemove(reg)
  }

  function doRemove() {
    const reg = regToRemove
    setRegToRemove(null)
    startTransition(async () => {
      const result = await removeRegistration(reg!.id)
      if (result?.error) {
        toastError(result.error)
      }
    })
  }

  return (
    <>
      <Dialog
        open={regToRemove !== null}
        title="¿Quitar participante?"
        description={`Quitar a ${regToRemove?.contact.name} de este webinar.`}
        variant="danger"
        confirmLabel="Quitar"
        onConfirm={doRemove}
        onCancel={() => setRegToRemove(null)}
      />
      {registrations.length === 0 ? (
      <div className={`${TOK.emptyState} ${TOK.textSubtle}`}>
        No hay participantes todavía. Agrega contactos o importa un CSV.
      </div>
      ) : (
      <div>
      {/* Column headers */}
      <div className={`grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] ${TOK.textSubtle}`}
        style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 0.7fr 0.3fr' }}>
        <span>Contacto</span>
        <span>Email</span>
        <span>Estado</span>
        <span>Agregado</span>
        <span></span>
      </div>

      {registrations.map((reg) => {
        const currentStatus = statuses[reg.id] ?? reg.status
        const statusConfig = STATUS_OPTIONS.find((s) => s.value === currentStatus)
        return (
          <div key={reg.id}
            className="mb-1.5 grid items-center rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-3 last:mb-0"
            style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 0.7fr 0.3fr' }}>
            <a
              href={`/crm/contactos/${reg.contact.id}`}
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {reg.contact.name}
            </a>
            <span className={`text-sm ${TOK.textSubtle}`}>{reg.contact.email}</span>
            <div>
              <select
                value={currentStatus}
                onChange={(e) =>
                  handleStatusChange(reg.id, e.target.value as RegistrationStatus)
                }
                aria-label={`Estado de ${reg.contact.name}`}
                className={`rounded-lg border border-[var(--color-outline-variant)] py-1 pl-2 pr-6 text-xs font-medium focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary-fixed)] ${statusConfig?.colorClass ?? ''}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <span className={`text-xs ${TOK.textSubtle}`}>{relativeTime(reg.createdAt)}</span>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleRemove(reg)}
                aria-label={`Quitar a ${reg.contact.name}`}
                className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
      )}
    </>
  )
}
