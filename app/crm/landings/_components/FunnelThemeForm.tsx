'use client'

import { useActionState } from 'react'
import { updateThemeAction } from '../actions'
import { defaultTheme } from '@/lib/funnels/defaults'
import type { FunnelTheme } from '@/lib/funnels/types'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

function normalizeTheme(theme: unknown): FunnelTheme {
  return { ...defaultTheme, ...(theme && typeof theme === 'object' ? theme : {}) } as FunnelTheme
}

export function FunnelThemeForm({ funnelId, theme }: { funnelId: number; theme: unknown }) {
  const current = normalizeTheme(theme)
  const [state, action, pending] = useActionState(updateThemeAction.bind(null, funnelId), null)

  return (
    <form action={action} className={`${TOK.panel} ${TOK.panelPad}`}>
      <h2 className={TOK.sectionTitle}>Tema global</h2>
      <p className={`mt-1 ${TOK.sectionSubtitle}`}>Se aplica a todas las paginas del funnel.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className={TOK.label}>Fuente</span>
          <select name="font" defaultValue={current.font} className={TOK.selectLg}>
            <option value="serif">Serif editorial</option>
            <option value="sans">Sans moderno</option>
          </select>
        </label>
        <label>
          <span className={TOK.label}>Botones</span>
          <select name="buttonStyle" defaultValue={current.buttonStyle} className={TOK.selectLg}>
            <option value="solid">Solido</option>
            <option value="outline">Contorno</option>
          </select>
        </label>
        {([
          ['backgroundColor', 'Fondo'],
          ['surfaceColor', 'Superficie'],
          ['textColor', 'Texto'],
          ['mutedTextColor', 'Texto secundario'],
          ['accentColor', 'Acento'],
        ] as const).map(([key, label]) => (
          <label key={key}>
            <span className={TOK.label}>{label}</span>
            <input name={key} defaultValue={current[key]} className={TOK.inputNative} />
          </label>
        ))}
        <label>
          <span className={TOK.label}>Radio</span>
          <select name="radius" defaultValue={current.radius} className={TOK.selectLg}>
            <option value="none">Sin radios</option>
            <option value="sm">Suave</option>
            <option value="md">Medio</option>
          </select>
        </label>
      </div>
      {state?.error && <div className={`${TOK.errorBox} mt-4`}>{state.error}</div>}
      <Button type="submit" disabled={pending} className="mt-5">
        {pending ? 'Guardando...' : 'Guardar tema'}
      </Button>
    </form>
  )
}
