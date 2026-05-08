'use client'

import { useActionState } from 'react'
import type { CrmFormField } from '@prisma/client'
import { Save } from 'lucide-react'
import { updateField } from '../actions'
import { FIELD_TYPE_LABELS, slugify } from '../_lib/field-types'

interface Props {
  field: CrmFormField
}

export function FieldEditor({ field }: Props) {
  const action = updateField.bind(null, field.id)
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <section className="rounded-xl bg-white p-5 border border-gray-200">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Campo</h2>
      {state?.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="type" value={field.type} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {FIELD_TYPE_LABELS[field.type]}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Etiqueta</label>
          <input
            name="label"
            defaultValue={field.label}
            className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
          />
        </div>

        <FieldKeyInput defaultValue={field.fieldKey} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Placeholder</label>
          <input
            name="placeholder"
            defaultValue={field.placeholder ?? ''}
            className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Ayuda</label>
          <textarea
            name="helpText"
            defaultValue={field.helpText ?? ''}
            rows={2}
            className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="isRequired"
            defaultChecked={field.isRequired}
            className="h-4 w-4 rounded border-[#f2f2f2] accent-[#080808] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
          />
          Obligatorio
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mapeo a contacto</label>
          <select
            name="contactTarget"
            defaultValue={field.contactTarget}
            className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
          >
            <option value="NONE">Sin mapeo</option>
            <option value="NAME">Nombre</option>
            <option value="EMAIL">Correo</option>
            <option value="PHONE">Telefono</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save size={16} />
          {isPending ? 'Guardando...' : 'Guardar campo'}
        </button>
      </form>
    </section>
  )
}

function FieldKeyInput({ defaultValue }: { defaultValue: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Clave interna</label>
      <input
        name="fieldKey"
        defaultValue={defaultValue}
        onBlur={(event) => {
          event.currentTarget.value = slugify(event.currentTarget.value)
        }}
        className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 font-mono text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
      />
    </div>
  )
}
