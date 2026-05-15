'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { createTemplate, updateTemplate } from '../../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { Card } from '@/app/crm/_components/ui'

interface Template {
  id: number
  name: string
  channel: string
  subject: string | null
  previewText: string | null
  bodyText: string | null
  waTemplate: string | null
}

interface Props {
  template?: Template
}

export function TemplateForm({ template }: Props) {
  const action = template ? updateTemplate.bind(null, template.id) : createTemplate
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <Card className="max-w-3xl">
      <form action={formAction} className="space-y-5">
        {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
        {state?.message && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
            {state.message}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={TOK.label}>Nombre</label>
            <input name="name" required minLength={2} defaultValue={template?.name} className={TOK.inputNative} />
          </div>
          <div>
            <label className={TOK.label}>Canal</label>
            <select name="channel" defaultValue={template?.channel ?? 'EMAIL'} className={TOK.inputNative}>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={TOK.label}>Asunto (email)</label>
            <input name="subject" defaultValue={template?.subject ?? ''} placeholder="Hola {{nombre}}" className={TOK.inputNative} />
          </div>
          <div>
            <label className={TOK.label}>Preheader</label>
            <input name="previewText" defaultValue={template?.previewText ?? ''} placeholder="Texto breve..." className={TOK.inputNative} />
          </div>
        </div>

        <div>
          <label className={TOK.label}>Cuerpo (texto plano)</label>
          <textarea name="bodyText" rows={8} defaultValue={template?.bodyText ?? ''} className={TOK.inputNativeMultiline} />
          <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
            Variables: {'{{nombre}}'}, {'{{email}}'}, {'{{telefono}}'}, {'{{proyecto}}'}
          </p>
        </div>

        <div>
          <label className={TOK.label}>Nombre de plantilla WhatsApp</label>
          <input name="waTemplate" defaultValue={template?.waTemplate ?? ''} placeholder="hello_world" className={TOK.inputNative} />
        </div>

        <button type="submit" disabled={pending} className={`${TOK.actionPrimary} w-full justify-center`}>
          <Save size={16} />
          {pending ? 'Guardando...' : 'Guardar plantilla'}
        </button>
      </form>
    </Card>
  )
}
