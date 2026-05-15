'use client'

import { useEffect, useState } from 'react'
import type React from 'react'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { listPublishedFormsAction } from '../../../actions'

type FormOption = { id: number; name: string; slug: string; fieldCount: number }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FormEditor({ config, onChange }: Props) {
  const [forms, setForms] = useState<FormOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublishedFormsAction().then((data: FormOption[]) => {
      setForms(data)
      setLoading(false)
    })
  }, [])

  function handleFormSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value)
    const selected = forms.find((f) => f.id === id)
    if (selected) {
      onChange({ ...config, formId: selected.id, formSlug: selected.slug })
    } else {
      onChange({ ...config, formId: null, formSlug: null })
    }
  }

  const selectedId = typeof config.formId === 'number' ? config.formId : null

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Formulario</span>
        {loading ? (
          <select className={TOK.inputNative} disabled>
            <option>Cargando formularios…</option>
          </select>
        ) : forms.length === 0 ? (
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            No tienes formularios publicados.{' '}
            <a href="/crm/formularios" className="underline" target="_blank" rel="noreferrer">
              Crea uno aquí
            </a>
            .
          </p>
        ) : (
          <select
            className={TOK.inputNative}
            value={selectedId ?? ''}
            onChange={handleFormSelect}
          >
            <option value="">— Selecciona un formulario —</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.fieldCount} campo{f.fieldCount !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        )}
      </label>

      <label>
        <span className={TOK.label}>Título (opcional)</span>
        <input
          className={TOK.inputNative}
          placeholder="Usa el nombre del formulario si está vacío"
          value={(config.title as string) ?? ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </label>
    </div>
  )
}
