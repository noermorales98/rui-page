'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Config = { eyebrow?: string; title?: string; subtitle?: string; ctaText?: string; ctaHref?: string }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function HeroEditor({ config, onChange }: Props) {
  const c = config as Config
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Eyebrow</span>
        <input className={TOK.inputNative} value={c.eyebrow ?? ''} onChange={(e) => set('eyebrow', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Título <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} value={c.title ?? ''} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Subtítulo</span>
        <textarea className={TOK.inputNativeMultiline} rows={3} value={c.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Texto del botón</span>
        <input className={TOK.inputNative} value={c.ctaText ?? ''} onChange={(e) => set('ctaText', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Link del botón</span>
        <input className={TOK.inputNative} value={c.ctaHref ?? ''} onChange={(e) => set('ctaHref', e.target.value)} />
      </label>
    </div>
  )
}
