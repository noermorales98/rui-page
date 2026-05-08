'use client'

import { useState, useTransition } from 'react'
import type { CrmFormFieldType } from '@prisma/client'
import { Calendar, CalendarClock, Clock, Mail, Phone, Plus, TextCursorInput, UserRound } from 'lucide-react'
import { addField } from '../actions'
import { DEFAULT_FIELD_TEMPLATES } from '../_lib/field-types'

interface Props {
  formId: number
}

const ICONS: Record<CrmFormFieldType, React.ComponentType<{ size?: number }>> = {
  SHORT_TEXT: UserRound,
  FULL_NAME: TextCursorInput,
  PHONE: Phone,
  PHONE_WITH_COUNTRY: Phone,
  EMAIL: Mail,
  CUSTOM_DATE: Calendar,
  CUSTOM_TIME: Clock,
  CUSTOM_DATETIME: CalendarClock,
}

export function FieldPalette({ formId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd(type: CrmFormFieldType) {
    setError(null)
    startTransition(async () => {
      const result = await addField(formId, type)
      if (result.error) setError(result.error)
    })
  }

  return (
    <aside className="rounded-xl bg-white p-4 border border-gray-200">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Inputs</h2>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="space-y-2">
        {DEFAULT_FIELD_TEMPLATES.map((field) => {
          const Icon = ICONS[field.type]
          return (
            <button
              key={field.type}
              type="button"
              disabled={isPending}
              onClick={() => handleAdd(field.type)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <Icon size={16} />
                {field.label}
              </span>
              <Plus size={14} />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
