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
import { Button, Card, FormStatusBadge } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type FormWithFields = CrmForm & {
  fields: CrmFormField[]
  _count: { submissions: number }
}

interface Props {
  form: FormWithFields
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">{form.name}</h1>
            <FormStatusBadge status={form.status} />
          </div>
          <div className={`flex flex-wrap items-center gap-3 text-sm ${TOK.textMuted}`}>
            <code className="rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] px-2 py-1 font-mono text-xs">
              /formularios/{form.slug}
            </code>
            <Link
              href={`/formularios/${form.slug}`}
              target="_blank"
              className={`inline-flex items-center gap-1 ${TOK.linkAccent}`}
            >
              Abrir
              <ExternalLink size={14} />
            </Link>
            <Link
              href={`/embed/formularios/${form.slug}`}
              target="_blank"
              className={`inline-flex items-center gap-1 ${TOK.linkAccent}`}
            >
              Embed
              <ExternalLink size={14} />
            </Link>
            <Link href={`/crm/formularios/${form.id}/respuestas`} className={TOK.linkAccent}>
              {form._count.submissions} respuestas
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isStatusPending || form.status === 'DRAFT'}
            onClick={() => changeStatus('DRAFT')}
            className={TOK.actionSecondary}
          >
            Borrador
          </button>
          <button
            type="button"
            disabled={isStatusPending || form.status === 'PUBLISHED'}
            onClick={() => changeStatus('PUBLISHED')}
            className={TOK.actionAccent}
          >
            Publicar
          </button>
        </div>
      </div>

      {(statusMessage || settingsState?.error) && (
        <div className={`mb-4 ${TOK.errorBox}`}>{statusMessage ?? settingsState?.error}</div>
      )}

      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_340px]">
        <FieldPalette formId={form.id} />

        <Card className="min-h-[560px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={TOK.sectionTitle}>Vista del formulario</h2>
              <p className={`mt-1 ${TOK.sectionSubtitle}`}>{form.fields.length} campos configurados</p>
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
              <div className={TOK.emptyState}>
                <p className={TOK.textMuted}>Agrega un campo desde la paleta.</p>
              </div>
            )}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card>
            <h2 className={`mb-4 ${TOK.sectionTitle}`}>Configuracion</h2>
            <form action={settingsAction} className="space-y-4">
              <div>
                <label className={TOK.label}>Nombre</label>
                <input
                  name="name"
                  defaultValue={form.name}
                  className={TOK.inputNative}
                />
              </div>
              <div>
                <label className={TOK.label}>Slug</label>
                <SlugInput defaultValue={form.slug} />
              </div>
              <div>
                <label className={TOK.label}>Descripcion</label>
                <textarea
                  name="description"
                  defaultValue={form.description ?? ''}
                  rows={3}
                  className={TOK.inputNativeMultiline}
                />
              </div>
              <div>
                <label className={TOK.label}>Boton</label>
                <input
                  name="submitLabel"
                  defaultValue={form.submitLabel}
                  className={TOK.inputNative}
                />
              </div>
              <div>
                <label className={TOK.label}>Mensaje final</label>
                <textarea
                  name="successMessage"
                  defaultValue={form.successMessage}
                  rows={2}
                  className={TOK.inputNativeMultiline}
                />
              </div>
              <Button type="submit" disabled={isSavingSettings} className="w-full justify-center">
                <Save size={16} />
                {isSavingSettings ? 'Guardando...' : 'Guardar ajustes'}
              </Button>
            </form>
          </Card>

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
      className={`${TOK.inputNative} font-mono text-sm`}
    />
  )
}
