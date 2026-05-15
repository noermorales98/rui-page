'use client'

import { useState, useTransition } from 'react'
import type { CrmFormField } from '@prisma/client'
import { mergeHtmlFieldSettings } from '@/lib/forms/html-field'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { deleteField, moveField } from '../actions'
import { Dialog } from '@/app/crm/_components/ui'
import { FIELD_TYPE_LABELS } from '../_lib/field-types'

interface Props {
  field: CrmFormField
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  onSelect: () => void
}

export function FieldPreviewCard({ field, isSelected, isFirst, isLast, onSelect }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const htmlHint =
    field.type === 'HTML_INPUT'
      ? (() => {
          const h = mergeHtmlFieldSettings(field.config)
          return h.element === 'input' ? `${h.element} · ${h.inputType ?? 'text'}` : h.element
        })()
      : null

  function run(action: () => Promise<{ error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
    })
  }

  return (
    <>
      <Dialog
        open={confirmDeleteOpen}
        title="¿Eliminar campo?"
        description={`Eliminar "${field.label}" del formulario.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={() => {
          setConfirmDeleteOpen(false)
          run(() => deleteField(field.id))
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
      <div
        className={`rounded-[var(--radius-md)] p-4 transition ${
          isSelected
            ? 'bg-[var(--color-primary-fixed)]/35'
            : 'bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)]'
        }`}
      >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-on-surface)]">{field.label}</span>
            {field.isRequired && (
              <span className="rounded-full bg-[var(--color-error-container)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-on-error-container)]">
                Obligatorio
              </span>
            )}
          </div>
          <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-container-low)] px-3 py-2 text-sm text-[var(--color-on-surface-variant)]">
            {field.placeholder || htmlHint || FIELD_TYPE_LABELS[field.type]}
          </div>
          {field.helpText && <p className="mt-2 text-xs text-[var(--color-on-surface-variant)]">{field.helpText}</p>}
          <p className="mt-2 font-mono text-[11px] text-[var(--color-on-surface-variant)]">{field.fieldKey}</p>
        </button>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={isPending || isFirst}
            onClick={() => run(() => moveField(field.id, 'up'))}
            className="rounded-[var(--radius-sm)] p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-lowest)] hover:text-[var(--color-on-surface)] disabled:opacity-40"
            aria-label="Mover arriba"
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            disabled={isPending || isLast}
            onClick={() => run(() => moveField(field.id, 'down'))}
            className="rounded-[var(--radius-sm)] p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-lowest)] hover:text-[var(--color-on-surface)] disabled:opacity-40"
            aria-label="Mover abajo"
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmDeleteOpen(true)}
            className="rounded-[var(--radius-sm)] p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] disabled:opacity-40"
            aria-label="Eliminar campo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {error && <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-error-container)] px-3 py-2 text-xs text-[var(--color-on-error-container)]">{error}</p>}
      </div>
    </>
  )
}
