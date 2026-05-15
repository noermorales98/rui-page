'use client'

import { useState, useTransition } from 'react'
import type { CrmFormContactTarget } from '@prisma/client'
import { createFieldSchema } from '@/lib/validators/forms'
import type { PalettePreset } from '../_lib/palette-presets'
import { addField } from '../actions'
import { slugify } from '../_lib/field-types'
import { TOK } from '@/app/crm/_lib/ui-tokens'

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
        className="absolute inset-0 bg-[var(--color-overlay)]"
        aria-label="Cerrar"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-field-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--shadow-md)]"
      >
        <h2 id="add-field-title" className="text-lg font-semibold text-[var(--color-on-surface)]">
          Agregar campo
        </h2>
        <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
          Tipo: <span className="font-medium text-[var(--color-on-surface)]">{preset.title}</span>
          {preset.subtitle ? (
            <>
              {' '}
              · <span className="text-[var(--color-on-surface-variant)]">{preset.subtitle}</span>
            </>
          ) : null}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-on-surface-variant)]">
          Solo completa lo que verá tu cliente. El tipo de control ya está definido; si necesitas cambiar opciones
          avanzadas (lista, rangos, etc.), podrás hacerlo después en el panel derecho al seleccionar el campo.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <p className={TOK.errorBox}>{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-on-surface)]">Texto de la pregunta o etiqueta</label>
            <input
              value={label}
              onChange={(ev) => setLabel(ev.target.value)}
              className={TOK.inputCompact}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-on-surface)]">Nombre interno del campo</label>
            <input
              value={fieldKey}
              onChange={(ev) => setFieldKey(ev.target.value)}
              onBlur={() => setFieldKey(slugify(fieldKey))}
              className={`${TOK.inputCompact} font-mono`}
              required
            />
            <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
              Se usa por debajo para enlazar respuestas. Si ya existe uno parecido, el sistema añadirá un sufijo
              automáticamente.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-on-surface)]">Texto de ejemplo (placeholder)</label>
            <input
              value={placeholder}
              onChange={(ev) => setPlaceholder(ev.target.value)}
              className={TOK.inputCompact}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-on-surface)]">Texto de ayuda (opcional)</label>
            <textarea
              value={helpText}
              onChange={(ev) => setHelpText(ev.target.value)}
              rows={2}
              className={TOK.inputCompact}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(ev) => setIsRequired(ev.target.checked)}
              className="h-4 w-4 rounded accent-[var(--color-on-surface)]"
            />
            Respuesta obligatoria
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-on-surface)]">
              ¿Guardar también en la ficha del contacto?
            </label>
            <select
              value={contactTarget}
              onChange={(ev) => setContactTarget(ev.target.value as CrmFormContactTarget)}
              className={TOK.inputCompact}
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
              className={TOK.actionSecondary}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`${TOK.actionPrimary} disabled:opacity-60`}
            >
              {pending ? 'Guardando…' : 'Agregar campo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
