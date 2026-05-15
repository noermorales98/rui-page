'use client'

import { useActionState } from 'react'
import type { FunnelPage } from '@prisma/client'
import { saveHtmlAction } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function FunnelHtmlEditor({ page }: { page: FunnelPage }) {
  const [state, action, pending] = useActionState(saveHtmlAction.bind(null, page.id), null)

  return (
    <form action={action} className={`${TOK.panel} ${TOK.panelPad}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={TOK.sectionTitle}>HTML completo: {page.title ?? page.key}</h2>
          <p className={`mt-1 ${TOK.sectionSubtitle}`}>El HTML se sanitiza al guardar. Scripts y handlers inline no se permiten.</p>
        </div>
        <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Guardar HTML'}</Button>
      </div>
      <div className="mt-5 grid gap-4">
        <label>
          <span className={TOK.label}>HTML</span>
          <textarea name="customHtml" defaultValue={page.customHtml ?? ''} rows={12} className={`${TOK.inputNativeMultiline} font-mono`} />
        </label>
        <label>
          <span className={TOK.label}>CSS</span>
          <textarea name="customCss" defaultValue={page.customCss ?? ''} rows={8} className={`${TOK.inputNativeMultiline} font-mono`} />
        </label>
      </div>
      {state?.error && <div className={`${TOK.errorBox} mt-4`}>{state.error}</div>}
    </form>
  )
}
