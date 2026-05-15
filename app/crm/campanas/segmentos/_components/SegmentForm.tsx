'use client'

import { useActionState, useState } from 'react'
import { Save, Eye } from 'lucide-react'
import { createSegment, updateSegment, previewSegmentRecipients } from '../../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { Card } from '@/app/crm/_components/ui'

interface Segment {
  id: number
  name: string
  description: string | null
  isDynamic: boolean
  filters: unknown
}

interface Props {
  segment?: Segment
}

const FILTER_PLACEHOLDER = JSON.stringify(
  { and: [{ field: 'status', op: 'in', value: ['NEW', 'QUALIFIED'] }] },
  null,
  2,
)

export function SegmentForm({ segment }: Props) {
  const action = segment ? updateSegment.bind(null, segment.id) : createSegment
  const [state, formAction, pending] = useActionState(action, null)
  const [preview, setPreview] = useState<{ count?: number; sample?: { id: number; name: string; email: string }[]; error?: string } | null>(null)
  const [previewing, setPreviewing] = useState(false)

  async function handlePreview() {
    if (!segment) return
    setPreviewing(true)
    const result = await previewSegmentRecipients(segment.id)
    setPreview(result)
    setPreviewing(false)
  }

  return (
    <Card className="max-w-3xl">
      <form action={formAction} className="space-y-5">
        {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
        {state?.message && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
            {state.message}
          </p>
        )}

        <div>
          <label className={TOK.label}>Nombre</label>
          <input name="name" required minLength={2} defaultValue={segment?.name} className={TOK.inputNative} />
        </div>

        <div>
          <label className={TOK.label}>Descripción</label>
          <textarea name="description" rows={2} defaultValue={segment?.description ?? ''} className={TOK.inputNativeMultiline} />
        </div>

        <div>
          <label className={TOK.label}>Filtros (JSON)</label>
          <textarea
            name="filters"
            required
            rows={10}
            defaultValue={segment ? JSON.stringify(segment.filters, null, 2) : FILTER_PLACEHOLDER}
            className={`${TOK.inputNativeMultiline} font-mono text-xs`}
          />
          <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
            Campos: status, source, tag, createdAt, dealStage. Ops: eq, in, gte, lte.
          </p>
        </div>

        <div className="flex gap-2">
          {segment && (
            <button
              type="button"
              disabled={previewing}
              onClick={handlePreview}
              className={TOK.actionSecondary}
            >
              <Eye size={15} />
              {previewing ? 'Calculando...' : 'Vista previa'}
            </button>
          )}
          <button type="submit" disabled={pending} className={`${TOK.actionPrimary} flex-1 justify-center`}>
            <Save size={16} />
            {pending ? 'Guardando...' : 'Guardar segmento'}
          </button>
        </div>

        {preview && (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-4">
            {preview.error ? (
              <p className={TOK.errorBox}>{preview.error}</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">{preview.count} contactos</p>
                {preview.sample && preview.sample.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {preview.sample.map((c) => (
                      <p key={c.id} className="truncate text-xs text-[var(--color-on-surface-variant)]">
                        {c.name} · {c.email}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </form>
    </Card>
  )
}
