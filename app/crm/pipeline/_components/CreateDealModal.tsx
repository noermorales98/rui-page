'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import type { DealStage } from '@prisma/client'
import { createDeal, updateDeal } from '../actions'
import type { DealWithContact } from './PipelineBoard'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEMO', label: 'Demo / Llamada' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ENROLLED', label: 'Inscrito' },
]

interface ContactOption {
  id: number
  name: string
  email: string
}

interface Props {
  deal?: DealWithContact
  initialStage?: DealStage
  lockedContact?: { id: number; name: string }
  onClose: () => void
}

export function CreateDealModal({ deal, initialStage, lockedContact, onClose }: Props) {
  const submittedRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState(
    deal?.contact.name ?? lockedContact?.name ?? '',
  )
  const [searchResults, setSearchResults] = useState<ContactOption[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(
    deal
      ? { id: deal.contact.id, name: deal.contact.name, email: deal.contact.email }
      : lockedContact
        ? { id: lockedContact.id, name: lockedContact.name, email: '' }
        : null,
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isContactLocked = Boolean(deal || lockedContact)

  const action = deal ? updateDeal.bind(null, deal.id) : createDeal
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (submittedRef.current && !isPending && state === null) {
      onClose()
    }
  }, [isPending, state, onClose])

  useEffect(() => {
    if (isContactLocked) return

    if (searchTimer.current) clearTimeout(searchTimer.current)

    if (!searchQuery.trim()) {
      return
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/crm/contacts-search?q=${encodeURIComponent(searchQuery)}`,
        )
        if (res.ok) {
          const data = (await res.json()) as ContactOption[]
          setSearchResults(data)
          setShowDropdown(data.length > 0)
        }
      } catch {
        // network error — ignore
      }
    }, 300)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery, isContactLocked])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4">
      <div
        className={TOK.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deal-modal-title"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 id="deal-modal-title" className={TOK.modalTitle}>
            {deal ? 'Editar oportunidad' : 'Nueva oportunidad'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={TOK.closeIconBtn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <form action={formAction} onSubmit={() => { submittedRef.current = true }}>
          {/* Contact */}
          <div className="mb-4">
            <label className={TOK.label}>
              Contacto <span className="text-[var(--color-error)]">*</span>
            </label>
            <input type="hidden" name="contactId" value={selectedContact?.id ?? ''} />
            {isContactLocked ? (
              <p className={`rounded-full px-5 py-3 text-sm text-[var(--color-on-surface)] ${TOK.fieldBg}`}>
                {searchQuery}
              </p>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (!e.target.value.trim()) {
                      setSearchResults([])
                      setShowDropdown(false)
                    }
                    if (selectedContact && e.target.value !== selectedContact.name) {
                      setSelectedContact(null)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Buscar por nombre o email..."
                  className={TOK.inputNative}
                />
                {showDropdown && (
                  <ul className="absolute z-10 mt-1 w-full rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-1 shadow-[var(--shadow-sm)]">
                    {searchResults.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setSelectedContact(c)
                            setSearchQuery(c.name)
                            setShowDropdown(false)
                          }}
                          className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition hover:bg-[var(--color-surface-container)]"
                        >
                          <span className="font-medium text-[var(--color-on-surface)]">{c.name}</span>
                          <span className="ml-2 text-xs text-[var(--color-on-surface-variant)]">{c.email}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Course name */}
          <div className="mb-4">
            <label className={TOK.label}>
              Curso{' '}
              <span className="font-normal text-[var(--color-on-surface-variant)]/80">(opcional)</span>
            </label>
            <input
              type="text"
              name="courseName"
              defaultValue={deal?.courseName ?? ''}
              placeholder="ej. Presencia Escénica"
              className={TOK.inputNative}
            />
          </div>

          {/* Stage */}
          <div className="mb-4">
            <label className={TOK.label}>Etapa</label>
            <select
              name="stage"
              defaultValue={deal?.stage ?? initialStage ?? 'LEAD'}
              className={TOK.selectLg}
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className={TOK.label}>
              Notas{' '}
              <span className="font-normal text-[var(--color-on-surface-variant)]/80">(opcional)</span>
            </label>
            <textarea
              name="notes"
              defaultValue={deal?.notes ?? ''}
              rows={3}
              placeholder="Observaciones sobre esta oportunidad..."
              className={TOK.inputNativeMultiline}
            />
          </div>

          {state?.error && (
            <div className={TOK.errorBox}>
              {state.error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`w-full font-sans ${TOK.actionSecondary}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || (!isContactLocked && !selectedContact)}
              className={`w-full font-sans disabled:opacity-60 ${TOK.actionPrimary}`}
            >
              {isPending ? 'Guardando...' : deal ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
