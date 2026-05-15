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
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  field: CrmFormField
}

const FIELD_INPUT = TOK.inputCompact
const FIELD_LABEL = 'mb-1 block text-sm font-medium text-[var(--color-on-surface)]'
const FIELD_LABEL_SM = 'mb-1 block text-xs font-medium text-[var(--color-on-surface)]'

export function FieldEditor({ field }: Props) {
  const action = updateField.bind(null, field.id)
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] p-5">
      <h2 className="mb-4 text-base font-semibold text-[var(--color-on-surface)]">Campo</h2>
      {state?.error && (
        <p className={TOK.errorBox}>{state.error}</p>
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="type" value={field.type} />

        <div>
          <label className={FIELD_LABEL}>Tipo</label>
          <p className="rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm text-[var(--color-on-surface-variant)]">
            {FIELD_TYPE_LABELS[field.type]}
          </p>
        </div>

        <div>
          <label className={FIELD_LABEL}>Etiqueta</label>
          <input
            name="label"
            defaultValue={field.label}
            className={FIELD_INPUT}
          />
        </div>

        <FieldKeyInput defaultValue={field.fieldKey} />

        <div>
          <label className={FIELD_LABEL}>Placeholder</label>
          <input
            name="placeholder"
            defaultValue={field.placeholder ?? ''}
            className={FIELD_INPUT}
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Ayuda</label>
          <textarea
            name="helpText"
            defaultValue={field.helpText ?? ''}
            rows={2}
            className={FIELD_INPUT}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
          <input
            type="checkbox"
            name="isRequired"
            defaultChecked={field.isRequired}
            className="h-4 w-4 rounded accent-[var(--color-on-surface)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-primary-fixed)]"
          />
          Obligatorio
        </label>

        <div>
          <label className={FIELD_LABEL}>Mapeo a contacto</label>
          <select
            name="contactTarget"
            defaultValue={field.contactTarget}
            className={FIELD_INPUT}
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
          className={TOK.actionPrimary}
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
    <div className="space-y-3 rounded-[var(--radius-md)] bg-[var(--color-primary-fixed)]/35 p-4">
      <h3 className="text-sm font-semibold text-[var(--color-on-primary-fixed)]">Control HTML</h3>

      <div>
        <label className={FIELD_LABEL_SM}>Elemento</label>
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
          className={FIELD_INPUT}
        >
          <option value="input">input</option>
          <option value="textarea">textarea</option>
          <option value="select">select</option>
        </select>
      </div>

      {html.element === 'input' && (
        <div>
          <label className={FIELD_LABEL_SM}>Tipo de input</label>
          <select
            value={html.inputType ?? 'text'}
            onChange={(ev) =>
              patch({ inputType: ev.target.value as (typeof HTML_NATIVE_INPUT_TYPE_LIST)[number] })
            }
            className={`${FIELD_INPUT} font-mono`}
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
          <label className={FIELD_LABEL_SM}>Filas</label>
          <input
            type="number"
            min={1}
            max={50}
            value={html.rows ?? 4}
            onChange={(ev) => patch({ rows: Number(ev.target.value) || 4 })}
            className={FIELD_INPUT}
          />
        </div>
      )}

      {(html.element === 'select' || html.inputType === 'radio' || html.inputType === 'checkbox') && (
        <div>
          <label className={FIELD_LABEL_SM}>
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
            className={`${FIELD_INPUT} font-mono text-xs`}
            spellCheck={false}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={FIELD_LABEL_SM}>min</label>
          <input
            type="number"
            value={html.min ?? ''}
            onChange={(ev) => patch({ min: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label className={FIELD_LABEL_SM}>max</label>
          <input
            type="number"
            value={html.max ?? ''}
            onChange={(ev) => patch({ max: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label className={FIELD_LABEL_SM}>step</label>
          <input
            value={html.step === undefined ? '' : String(html.step)}
            onChange={(ev) => {
              const v = ev.target.value
              if (v === '') patch({ step: undefined })
              else if (/^-?\d+(\.\d+)?$/.test(v)) patch({ step: Number(v) })
              else patch({ step: v })
            }}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={FIELD_LABEL_SM}>minLength</label>
          <input
            type="number"
            min={0}
            value={html.minLength ?? ''}
            onChange={(ev) => patch({ minLength: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <label className={FIELD_LABEL_SM}>maxLength</label>
          <input
            type="number"
            min={1}
            value={html.maxLength ?? ''}
            onChange={(ev) => patch({ maxLength: ev.target.value === '' ? undefined : Number(ev.target.value) })}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      <div>
        <label className={FIELD_LABEL_SM}>pattern (regex HTML)</label>
        <input
          value={html.pattern ?? ''}
          onChange={(ev) => patch({ pattern: ev.target.value || undefined })}
          className={`${FIELD_INPUT} font-mono text-xs`}
          spellCheck={false}
        />
      </div>

      <div>
        <label className={FIELD_LABEL_SM}>accept (solo file)</label>
        <input
          value={html.accept ?? ''}
          onChange={(ev) => patch({ accept: ev.target.value || undefined })}
          className={`${FIELD_INPUT} text-xs`}
          placeholder=".pdf,image/*"
        />
      </div>

      <div>
        <label className={FIELD_LABEL_SM}>Valor inicial (hidden)</label>
        <input
          value={html.defaultValue ?? ''}
          onChange={(ev) => patch({ defaultValue: ev.target.value || undefined })}
          className={FIELD_INPUT}
        />
      </div>

      <div>
        <label className={FIELD_LABEL_SM}>autocomplete</label>
        <input
          value={html.autocomplete ?? ''}
          onChange={(ev) => patch({ autocomplete: ev.target.value || undefined })}
          className={FIELD_INPUT}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
        <input
          type="checkbox"
          checked={Boolean(html.multiple)}
          onChange={(ev) => patch({ multiple: ev.target.checked || undefined })}
          className="h-4 w-4 rounded accent-[var(--color-on-surface)]"
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
      <label className={FIELD_LABEL}>Clave interna</label>
      <input
        name="fieldKey"
        defaultValue={defaultValue}
        onBlur={(event) => {
          event.currentTarget.value = slugify(event.currentTarget.value)
        }}
        className={`${FIELD_INPUT} font-mono text-sm`}
      />
    </div>
  )
}
