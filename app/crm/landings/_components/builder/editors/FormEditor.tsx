'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FormEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título del formulario</span>
        <input
          className={TOK.inputNative}
          value={(config.title as string) ?? ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </label>
      <p className="text-xs text-[var(--color-on-surface-variant)]">
        El formulario de registro se inyecta automáticamente. Solo puedes personalizar el título.
      </p>
    </div>
  )
}
