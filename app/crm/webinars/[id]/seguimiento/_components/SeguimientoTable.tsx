'use client'

import { useState, startTransition, useRef, useEffect } from 'react'
import type { CommercialStatus, RegistrationStatus } from '@prisma/client'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import {
  applyFilter,
  calcLeadScore,
  type FilterKey,
  type RegistrationRow,
  type LeadScore,
} from '../_lib/seguimiento'
import { updateCommercialStatus as updateCommercialStatusAction } from '../actions'
import { RowActionsMenu } from './RowActionsMenu'
import { CreateDealModal } from './CreateDealModal'
import { AddNoteModal } from './AddNoteModal'

// ── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

// ── constants ────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey | 'seguimiento_vencido'; label: string; disabled?: boolean }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'registrados', label: 'Registrados' },
  { key: 'asistieron', label: 'Asistieron' },
  { key: 'no_asistieron', label: 'No asistieron' },
  { key: 'compraron', label: 'Compraron' },
  { key: 'no_compraron', label: 'No compraron' },
  { key: 'contactados', label: 'Contactados' },
  { key: 'sin_contactar', label: 'Sin contactar' },
  { key: 'caliente', label: 'Lead caliente' },
  { key: 'plan_pagos', label: 'Plan de pagos' },
  { key: 'seguimiento_vencido', label: 'Seguimiento vencido', disabled: true },
]

const REGISTRATION_STATUS_OPTIONS: { value: RegistrationStatus; label: string; colorClass: string }[] = [
  { value: 'REGISTERED', label: 'Registrado', colorClass: 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' },
  { value: 'ATTENDED', label: 'Asistió', colorClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' },
  { value: 'PURCHASED', label: 'Compró', colorClass: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]' },
]

const COMMERCIAL_STATUS_OPTIONS: { value: CommercialStatus; label: string; colorClass: string }[] = [
  { value: 'SIN_CONTACTAR', label: 'Sin contactar', colorClass: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]' },
  { value: 'CONTACTADO', label: 'Contactado', colorClass: 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' },
  { value: 'INTERESADO', label: 'Interesado', colorClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' },
  { value: 'PLAN_PAGOS', label: 'Plan de pagos', colorClass: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]' },
  { value: 'NO_RESPONDE', label: 'No responde', colorClass: 'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]' },
  { value: 'DESCARTADO', label: 'Descartado', colorClass: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] opacity-60' },
]

const LEAD_SCORE_CONFIG: Record<LeadScore, { label: string; colorClass: string }> = {
  CALIENTE: { label: 'Caliente 🔥', colorClass: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]' },
  TIBIO: { label: 'Tibio', colorClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' },
  FRIO: { label: 'Frío', colorClass: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]' },
}

// ── component ────────────────────────────────────────────────────────────────

interface Props {
  registrations: RegistrationRow[]
  webinarId: number
}

export function SeguimientoTable({ registrations, webinarId }: Props) {
  const [filter, setFilter] = useState<FilterKey>('todos')
  const [regStatuses, setRegStatuses] = useState<Record<number, RegistrationStatus>>(
    Object.fromEntries(registrations.map((r) => [r.id, r.status])),
  )
  const [commercialStatuses, setCommercialStatuses] = useState<Record<number, CommercialStatus>>(
    Object.fromEntries(registrations.map((r) => [r.id, r.commercialStatus])),
  )
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [dealModal, setDealModal] = useState<{ contactId: number; contactName: string } | null>(null)
  const [noteModal, setNoteModal] = useState<{ contactId: number; contactName: string } | null>(null)
  const { error: toastError } = useToast()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId !== null) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenuId])

  function handleCommercialStatusChange(registrationId: number, status: CommercialStatus) {
    const prev = commercialStatuses[registrationId]
    setCommercialStatuses((s) => ({ ...s, [registrationId]: status }))
    startTransition(async () => {
      const result = await updateCommercialStatusAction(registrationId, status, webinarId)
      if (result.error) {
        setCommercialStatuses((s) => ({ ...s, [registrationId]: prev }))
        toastError(result.error)
      }
    })
  }

  // Merge optimistic state into rows
  const rows = registrations.map((r) => ({
    ...r,
    status: regStatuses[r.id] ?? r.status,
    commercialStatus: commercialStatuses[r.id] ?? r.commercialStatus,
  }))

  const filtered = applyFilter(rows, filter)

  return (
    <>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          if (f.disabled) {
            return (
              <span
                key={f.key}
                title="Próximamente — requiere módulo de Tareas"
                className="cursor-not-allowed rounded-full px-3 py-1.5 text-xs font-medium opacity-40 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]"
              >
                {f.label}
              </span>
            )
          }
          const isActive = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key as FilterKey)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)]'
                  : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className={`${TOK.emptyState} ${TOK.textSubtle}`}>
          No hay contactos con este filtro.
        </div>
      ) : (
        <div className="mt-4">
          {/* Header */}
          <div className={`grid grid-cols-[1.8fr_1.4fr_1fr_1fr_1fr_1fr_0.8fr_auto] px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] ${TOK.textSubtle}`}>
            <span>Contacto</span>
            <span>Email</span>
            <span>Tel / WhatsApp</span>
            <span>Estado</span>
            <span>Lead score</span>
            <span>Comercial</span>
            <span>Última act.</span>
            <span />
          </div>

          {filtered.map((row) => {
            const score = calcLeadScore(row)
            const scoreConfig = LEAD_SCORE_CONFIG[score]
            const regStatusConfig = REGISTRATION_STATUS_OPTIONS.find((s) => s.value === row.status)
            const commercialConfig = COMMERCIAL_STATUS_OPTIONS.find((s) => s.value === row.commercialStatus)
            const lastActivity = row.contact.activities[0]
            const isMenuOpen = openMenuId === row.id

            return (
              <div key={row.id} className="relative mb-1.5 last:mb-0">
                <div className="grid grid-cols-[1.8fr_1.4fr_1fr_1fr_1fr_1fr_0.8fr_auto] items-center gap-2 rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-3">
                  {/* Contacto */}
                  <a
                    href={`/crm/contactos/${row.contact.id}`}
                    className="truncate text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {row.contact.name}
                  </a>

                  {/* Email */}
                  <span className={`truncate text-sm ${TOK.textSubtle}`}>{row.contact.email}</span>

                  {/* Teléfono */}
                  {row.contact.phone ? (
                    <a
                      href={`https://wa.me/${row.contact.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-[var(--color-primary)] hover:underline"
                    >
                      {row.contact.phone}
                    </a>
                  ) : (
                    <span className={`text-sm ${TOK.textSubtle}`}>—</span>
                  )}

                  {/* Estado registro */}
                  <div>
                    <span className={`inline-block rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium ${regStatusConfig?.colorClass ?? ''}`}>
                      {regStatusConfig?.label ?? row.status}
                    </span>
                  </div>

                  {/* Lead score */}
                  <div>
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${scoreConfig.colorClass}`}>
                      {scoreConfig.label}
                    </span>
                  </div>

                  {/* Estado comercial — inline select */}
                  <div>
                    <select
                      value={row.commercialStatus}
                      onChange={(e) => handleCommercialStatusChange(row.id, e.target.value as CommercialStatus)}
                      aria-label={`Estado comercial de ${row.contact.name}`}
                      className={`rounded-[var(--radius-sm)] border-0 py-1 pl-2 pr-6 text-xs font-medium outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] ${commercialConfig?.colorClass ?? ''}`}
                    >
                      {COMMERCIAL_STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Última actividad */}
                  <span className={`text-xs ${TOK.textSubtle}`}>
                    {lastActivity ? relativeTime(lastActivity.createdAt) : '—'}
                  </span>

                  {/* Acciones */}
                  <div className="relative flex justify-end" ref={isMenuOpen ? menuRef : undefined}>
                    <button
                      type="button"
                      aria-label={`Acciones para ${row.contact.name}`}
                      onClick={() => setOpenMenuId(isMenuOpen ? null : row.id)}
                      className="rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-low)]"
                    >
                      ···
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-md)]">
                        <RowActionsMenu
                          row={row}
                          webinarId={webinarId}
                          onClose={() => setOpenMenuId(null)}
                          onCommercialStatusChange={handleCommercialStatusChange}
                          onOpenDealModal={(contactId, contactName) => setDealModal({ contactId, contactName })}
                          onOpenNoteModal={(contactId, contactName) => setNoteModal({ contactId, contactName })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {dealModal && (
        <CreateDealModal
          contactId={dealModal.contactId}
          contactName={dealModal.contactName}
          webinarId={webinarId}
          onClose={() => setDealModal(null)}
        />
      )}
      {noteModal && (
        <AddNoteModal
          contactId={noteModal.contactId}
          contactName={noteModal.contactName}
          webinarId={webinarId}
          onClose={() => setNoteModal(null)}
        />
      )}
    </>
  )
}
