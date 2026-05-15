'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function CustomHtmlEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-sm)] bg-[var(--color-error-container)] px-3 py-2 text-xs text-[var(--color-on-error-container)]">
        Scripts e handlers inline no se permiten. El HTML se sanitiza al guardar.
      </div>
      <label>
        <span className={TOK.label}>HTML <span className="text-[var(--color-error)]">*</span></span>
        <textarea
          className={`${TOK.inputNativeMultiline} font-mono text-xs`}
          rows={10}
          value={(config.html as string) ?? ''}
          onChange={(e) => onChange({ ...config, html: e.target.value })}
          spellCheck={false}
        />
      </label>
      <label>
        <span className={TOK.label}>CSS</span>
        <textarea
          className={`${TOK.inputNativeMultiline} font-mono text-xs`}
          rows={6}
          value={(config.css as string) ?? ''}
          onChange={(e) => onChange({ ...config, css: e.target.value })}
          spellCheck={false}
        />
      </label>
    </div>
  )
}
