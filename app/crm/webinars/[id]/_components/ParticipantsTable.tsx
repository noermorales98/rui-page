'use client'

import { useState, startTransition } from 'react'
import type { RegistrationStatus } from '@prisma/client'
import { updateRegistrationStatus, removeRegistration } from '../../actions'

export type RegistrationWithContact = {
  id: number
  status: RegistrationStatus
  createdAt: Date | string
  contactId: number
  contact: { id: number; name: string; email: string }
}

const STATUS_OPTIONS: { value: RegistrationStatus; label: string; colorClass: string }[] = [
  { value: 'REGISTERED', label: 'Registrado', colorClass: 'bg-indigo-50 text-indigo-700' },
  { value: 'ATTENDED', label: 'Asistió', colorClass: 'bg-yellow-50 text-yellow-700' },
  { value: 'PURCHASED', label: 'Compró', colorClass: 'bg-green-50 text-green-700' },
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
    if (!window.confirm(`¿Quitar a ${reg.contact.name} de este webinar?`)) return
    startTransition(async () => {
      const result = await removeRegistration(reg.id)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  if (registrations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
        No hay participantes todavía. Agrega contactos o importa un CSV.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 text-left">Contacto</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-left">Agregado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => {
            const currentStatus = statuses[reg.id] ?? reg.status
            const statusConfig = STATUS_OPTIONS.find((s) => s.value === currentStatus)
            return (
              <tr key={reg.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">
                  <a
                    href={`/crm/contactos/${reg.contact.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {reg.contact.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{reg.contact.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={currentStatus}
                    onChange={(e) =>
                      handleStatusChange(reg.id, e.target.value as RegistrationStatus)
                    }
                    aria-label={`Estado de ${reg.contact.name}`}
                    className={`rounded-lg border-0 py-1 pl-2 pr-6 text-xs font-medium ring-1 ring-gray-200 focus:outline-none focus:ring-indigo-400 ${statusConfig?.colorClass ?? ''}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {relativeTime(reg.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleRemove(reg)}
                    aria-label={`Quitar a ${reg.contact.name}`}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
