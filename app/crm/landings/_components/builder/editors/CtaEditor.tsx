'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function CtaEditor({ config, onChange }: Props) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título</span>
        <input className={TOK.inputNative} value={(config.title as string) ?? ''} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Descripción</span>
        <textarea className={TOK.inputNativeMultiline} rows={3} value={(config.body as string) ?? ''} onChange={(e) => set('body', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Texto del botón <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} value={(config.buttonText as string) ?? ''} onChange={(e) => set('buttonText', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Link del botón <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} value={(config.href as string) ?? ''} onChange={(e) => set('href', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Estilo</span>
        <select className={TOK.select} value={(config.variant as string) ?? 'primary'} onChange={(e) => set('variant', e.target.value)}>
          <option value="primary">Sólido</option>
          <option value="outline">Contorno</option>
        </select>
      </label>
    </div>
  )
}
