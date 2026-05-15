'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function VideoEditor({ config, onChange }: Props) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>URL del video <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} placeholder="https://youtube.com/..." value={(config.url as string) ?? ''} onChange={(e) => set('url', e.target.value)} />
        <span className="mt-1 block text-xs text-[var(--color-on-surface-variant)]">YouTube, Vimeo, .mp4 o .webm</span>
      </label>
      <label>
        <span className={TOK.label}>Pie de video</span>
        <input className={TOK.inputNative} value={(config.caption as string) ?? ''} onChange={(e) => set('caption', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Proporción</span>
        <select className={TOK.select} value={(config.aspect as string) ?? '16/9'} onChange={(e) => set('aspect', e.target.value)}>
          <option value="16/9">16:9</option>
          <option value="4/3">4:3</option>
        </select>
      </label>
    </div>
  )
}
