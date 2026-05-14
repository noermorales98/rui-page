'use client'

import { useState, useTransition } from 'react'
import type { CrmFormContactTarget } from '@prisma/client'
import { createFieldSchema } from '@/lib/validators/forms'
import type { PalettePreset } from '../_lib/palette-presets'
import { addField } from '../actions'
import { slugify } from '../_lib/field-types'

type Props = {
  formId: number
  preset: PalettePreset
  onClose: () => void
}

function cloneConfig(config: unknown): unknown | null {
  if (config == null) return null
  try {
    return JSON.parse(JSON.stringify(config)) as unknown
  } catch {
    return null
  }
}

export function AddFieldDialog({ formId, preset, onClose }: Props) {
  const d = preset.defaults
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [label, setLabel] = useState(d.label)
  const [fieldKey, setFieldKey] = useState(d.fieldKey)
  const [placeholder, setPlaceholder] = useState(d.placeholder)
  const [helpText, setHelpText] = useState(d.helpText)
  const [isRequired, setIsRequired] = useState(d.isRequired)
  const [contactTarget, setContactTarget] = useState<CrmFormContactTarget>(d.contactTarget)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const config = d.type === 'HTML_INPUT' ? cloneConfig(d.config) : null

    const payload = {
      type: d.type,
      label: label.trim(),
      fieldKey: slugify(fieldKey),
      placeholder: placeholder.trim() || undefined,
      helpText: helpText.trim() || undefined,
      isRequired,
      contactTarget,
      config,
    }

    const parsed = createFieldSchema.safeParse(payload)
    if (!parsed.success) {
      const flat = parsed.error.flatten()
      const msg =
        Object.values(flat.fieldErrors).flat()[0] ??
        flat.formErrors[0] ??
        'Revisa los datos del campo'
      setError(msg)
      return
    }

    start(async () => {
      const res = await addField(formId, parsed.data)
      if (res.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-field-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 id="add-field-title" className="text-lg font-semibold text-gray-900">
          Agregar campo
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Tipo: <span className="font-medium text-gray-900">{preset.title}</span>
          {preset.subtitle ? (
            <>
              {' '}
              · <span className="text-gray-500">{preset.subtitle}</span>
            </>
          ) : null}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Solo completa lo que verá tu cliente. El tipo de control ya está definido; si necesitas cambiar opciones
          avanzadas (lista, rangos, etc.), podrás hacerlo después en el panel derecho al seleccionar el campo.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Texto de la pregunta o etiqueta</label>
            <input
              value={label}
              onChange={(ev) => setLabel(ev.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre interno del campo</label>
            <input
              value={fieldKey}
              onChange={(ev) => setFieldKey(ev.target.value)}
              onBlur={() => setFieldKey(slugify(fieldKey))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Se usa por debajo para enlazar respuestas. Si ya existe uno parecido, el sistema añadirá un sufijo
              automáticamente.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Texto de ejemplo (placeholder)</label>
            <input
              value={placeholder}
              onChange={(ev) => setPlaceholder(ev.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Texto de ayuda (opcional)</label>
            <textarea
              value={helpText}
              onChange={(ev) => setHelpText(ev.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(ev) => setIsRequired(ev.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
            />
            Respuesta obligatoria
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ¿Guardar también en la ficha del contacto?
            </label>
            <select
              value={contactTarget}
              onChange={(ev) => setContactTarget(ev.target.value as CrmFormContactTarget)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="NONE">No, solo en esta respuesta del formulario</option>
              <option value="NAME">Sí — nombre del contacto</option>
              <option value="EMAIL">Sí — correo del contacto</option>
              <option value="PHONE">Sí — teléfono del contacto</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {pending ? 'Guardando…' : 'Agregar campo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
