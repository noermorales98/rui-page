'use client'

import Link from 'next/link'
import { useActionState, useMemo, useState, useTransition } from 'react'
import type { CrmForm, CrmFormField, CrmFormStatus } from '@prisma/client'
import { ExternalLink, Save } from 'lucide-react'
import { setFormStatus, updateFormSettings } from '../actions'
import { FieldEditor } from './FieldEditor'
import { FieldPalette } from './FieldPalette'
import { FieldPreviewCard } from './FieldPreviewCard'
import { slugify } from '../_lib/field-types'

type FormWithFields = CrmForm & {
  fields: CrmFormField[]
  _count: { submissions: number }
}

interface Props {
  form: FormWithFields
}

const STATUS_LABELS: Record<CrmFormStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

const STATUS_CLASSES: Record<CrmFormStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
}

export function FormBuilder({ form }: Props) {
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(form.fields[0]?.id ?? null)
  const [isStatusPending, startStatusTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const selectedField = useMemo(
    () => form.fields.find((field) => field.id === selectedFieldId) ?? form.fields[0] ?? null,
    [form.fields, selectedFieldId],
  )

  const updateSettings = updateFormSettings.bind(null, form.id)
  const [settingsState, settingsAction, isSavingSettings] = useActionState(updateSettings, null)

  function changeStatus(status: CrmFormStatus) {
    setStatusMessage(null)
    startStatusTransition(async () => {
      const result = await setFormStatus(form.id, status)
      if (result.error) setStatusMessage(result.error)
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[form.status]}`}>
              {STATUS_LABELS[form.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <code className="rounded bg-white px-2 py-1 font-mono border border-gray-200">
              /formularios/{form.slug}
            </code>
            <Link
              href={`/formularios/${form.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
            >
              Abrir
              <ExternalLink size={14} />
            </Link>
            <Link
              href={`/crm/formularios/${form.id}/respuestas`}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {form._count.submissions} respuestas
            </Link>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isStatusPending || form.status === 'DRAFT'}
            onClick={() => changeStatus('DRAFT')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50"
          >
            Borrador
          </button>
          <button
            type="button"
            disabled={isStatusPending || form.status === 'PUBLISHED'}
            onClick={() => changeStatus('PUBLISHED')}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Publicar
          </button>
        </div>
      </div>

      {(statusMessage || settingsState?.error) && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {statusMessage ?? settingsState?.error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_340px]">
        <FieldPalette formId={form.id} />

        <section className="min-h-[560px] rounded-xl bg-white p-5 border border-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Vista del formulario</h2>
              <p className="mt-1 text-sm text-gray-500">{form.fields.length} campos configurados</p>
            </div>
          </div>

          <div className="space-y-3">
            {form.fields.map((field, index) => (
              <FieldPreviewCard
                key={field.id}
                field={field}
                isSelected={field.id === selectedField?.id}
                isFirst={index === 0}
                isLast={index === form.fields.length - 1}
                onSelect={() => setSelectedFieldId(field.id)}
              />
            ))}
            {form.fields.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center text-sm text-gray-400">
                Agrega un campo desde la paleta.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl bg-white p-5 border border-gray-200">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Configuracion</h2>
            <form action={settingsAction} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  name="name"
                  defaultValue={form.name}
                  className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                <SlugInput defaultValue={form.slug} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
                <textarea
                  name="description"
                  defaultValue={form.description ?? ''}
                  rows={3}
                  className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Boton</label>
                <input
                  name="submitLabel"
                  defaultValue={form.submitLabel}
                  className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mensaje final</label>
                <textarea
                  name="successMessage"
                  defaultValue={form.successMessage}
                  rows={2}
                  className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Save size={16} />
                {isSavingSettings ? 'Guardando...' : 'Guardar ajustes'}
              </button>
            </form>
          </section>

          {selectedField && <FieldEditor key={selectedField.id} field={selectedField} />}
        </aside>
      </div>
    </div>
  )
}

function SlugInput({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)

  return (
    <input
      name="slug"
      value={value}
      onChange={(event) => setValue(slugify(event.target.value))}
      className="w-full rounded-lg border border-[#f2f2f2] px-3 py-2 font-mono text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]"
    />
  )
}
