'use client'

import { useActionState, useMemo, useState } from 'react'
import type { CrmFormField } from '@prisma/client'
import { Save } from 'lucide-react'
import { parseFieldConfig } from '@/lib/forms/conditional'
import {
  HTML_NATIVE_INPUT_TYPE_LIST,
  mergeHtmlFieldSettings,
  type HtmlFieldSettings,
} from '@/lib/forms/html-field'
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

        {field.type === 'HTML_INPUT' && <HtmlFieldConfigEditor key={field.id} field={field} />}

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

function HtmlFieldConfigEditor({ field }: { field: CrmFormField }) {
  const [html, setHtml] = useState<HtmlFieldSettings>(() => mergeHtmlFieldSettings(field.config))

  const preservedShowWhen = useMemo(() => parseFieldConfig(field.config)?.showWhen, [field.config])
  const serialized = useMemo(
    () => JSON.stringify({ ...(preservedShowWhen ? { showWhen: preservedShowWhen } : {}), html }),
    [preservedShowWhen, html],
  )

  const optionsText = (html.options ?? []).join('\n')

  function patch(next: Partial<HtmlFieldSettings>) {
    setHtml((prev) => ({ ...prev, ...next }))
  }

  return (
    <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
      <h3 className="text-sm font-semibold text-indigo-950">Control HTML</h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Elemento</label>
        <select
          value={html.element}
          onChange={(ev) => {
            const element = ev.target.value as HtmlFieldSettings['element']
            if (element === 'textarea') {
              setHtml((prev) => ({
                ...prev,
                element: 'textarea',
                inputType: undefined,
                rows: prev.rows ?? 4,
              }))
              return
            }
            if (element === 'select') {
              setHtml((prev) => ({
                ...prev,
                element: 'select',
                inputType: undefined,
                options: prev.options?.length ? prev.options : ['Opción 1'],
              }))
              return
            }
            setHtml((prev) => ({
              ...prev,
              element: 'input',
              inputType: prev.inputType ?? 'text',
            }))
          }}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="input">input</option>
          <option value="textarea">textarea</option>
          <option value="select">select</option>
        </select>
      </div>

      {html.element === 'input' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Tipo de input</label>
          <select
            value={html.inputType ?? 'text'}
            onChange={(ev) =>
              patch({ inputType: ev.target.value as (typeof HTML_NATIVE_INPUT_TYPE_LIST)[number] })
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
          >
            {HTML_NATIVE_INPUT_TYPE_LIST.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {html.element === 'textarea' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Filas</label>
          <input
            type="number"
            min={1}
            max={50}
            value={html.rows ?? 4}
            onChange={(ev) => patch({ rows: Number(ev.target.value) || 4 })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      {(html.element === 'select' || html.inputType === 'radio' || html.inputType === 'checkbox') && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Opciones (una por línea; checkbox usa la primera como texto al lado)
          </label>
          <textarea
            value={optionsText}
            onChange={(ev) =>
              patch({
                options: ev.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={5}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
            spellCheck={false}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">min</label>
          <input
            type="number"
            value={html.min ?? ''}
            onChange={(ev) => patch({ min: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">max</label>
          <input
            type="number"
            value={html.max ?? ''}
            onChange={(ev) => patch({ max: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">step</label>
          <input
            value={html.step === undefined ? '' : String(html.step)}
            onChange={(ev) => {
              const v = ev.target.value
              if (v === '') patch({ step: undefined })
              else if (/^-?\d+(\.\d+)?$/.test(v)) patch({ step: Number(v) })
              else patch({ step: v })
            }}
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">minLength</label>
          <input
            type="number"
            min={0}
            value={html.minLength ?? ''}
            onChange={(ev) => patch({ minLength: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">maxLength</label>
          <input
            type="number"
            min={1}
            value={html.maxLength ?? ''}
            onChange={(ev) => patch({ maxLength: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">pattern (regex HTML)</label>
        <input
          value={html.pattern ?? ''}
          onChange={(ev) => patch({ pattern: ev.target.value || undefined })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
          spellCheck={false}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">accept (solo file)</label>
        <input
          value={html.accept ?? ''}
          onChange={(ev) => patch({ accept: ev.target.value || undefined })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
          placeholder=".pdf,image/*"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Valor inicial (hidden)</label>
        <input
          value={html.defaultValue ?? ''}
          onChange={(ev) => patch({ defaultValue: ev.target.value || undefined })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">autocomplete</label>
        <input
          value={html.autocomplete ?? ''}
          onChange={(ev) => patch({ autocomplete: ev.target.value || undefined })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(html.multiple)}
          onChange={(ev) => patch({ multiple: ev.target.checked || undefined })}
          className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
        />
        multiple (file o select)
      </label>

      <input type="hidden" name="fieldConfig" value={serialized} />
    </div>
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
