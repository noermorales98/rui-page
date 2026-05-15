'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function TextEditor({ config, onChange }: Props) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título de sección</span>
        <input className={TOK.inputNative} value={(config.title as string) ?? ''} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Cuerpo <span className="text-[var(--color-error)]">*</span></span>
        <textarea className={TOK.inputNativeMultiline} rows={6} value={(config.body as string) ?? ''} onChange={(e) => set('body', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Alineación</span>
        <select className={TOK.select} value={(config.align as string) ?? 'left'} onChange={(e) => set('align', e.target.value)}>
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
        </select>
      </label>
    </div>
  )
}
