'use client'

import { useState, useTransition } from 'react'
import type { CrmFormField } from '@prisma/client'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { deleteField, moveField } from '../actions'
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

  function run(action: () => Promise<{ error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
    })
  }

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        isSelected ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{field.label}</span>
            {field.isRequired && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                Obligatorio
              </span>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
            {field.placeholder || FIELD_TYPE_LABELS[field.type]}
          </div>
          {field.helpText && <p className="mt-2 text-xs text-gray-500">{field.helpText}</p>}
          <p className="mt-2 font-mono text-[11px] text-gray-400">{field.fieldKey}</p>
        </button>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={isPending || isFirst}
            onClick={() => run(() => moveField(field.id, 'up'))}
            className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-40"
            aria-label="Mover arriba"
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            disabled={isPending || isLast}
            onClick={() => run(() => moveField(field.id, 'down'))}
            className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-40"
            aria-label="Mover abajo"
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (window.confirm('Eliminar este campo?')) run(() => deleteField(field.id))
            }}
            className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-red-600 disabled:opacity-40"
            aria-label="Eliminar campo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    </div>
  )
}
