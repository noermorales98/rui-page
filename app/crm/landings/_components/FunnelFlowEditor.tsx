'use client'

import { useActionState, useMemo, useState } from 'react'
import type { Flow, FlowStep } from '@prisma/client'
import { saveAutomationAction } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type Automation = Flow & { steps: FlowStep[] }

const DEFAULT_STEPS = [
  { action: 'ASSIGN_TAG', delayMins: 0, config: { tagId: 1 } },
  { action: 'UPDATE_CONTACT_STATUS', delayMins: 0, config: { status: 'QUALIFIED' } },
]

export function FunnelFlowEditor({ funnelId, automations }: { funnelId: number; automations: Automation[] }) {
  const automation = automations[0]
  const initial = useMemo(
    () =>
      automation?.steps.map((step) => ({
        action: step.action,
        delayMins: step.delayMins,
        config: step.config,
      })) ?? DEFAULT_STEPS,
    [automation],
  )
  const [stepsText, setStepsText] = useState(JSON.stringify(initial, null, 2))
  const [state, action, pending] = useActionState(saveAutomationAction.bind(null, funnelId), null)

  return (
    <form action={action} className={`${TOK.panel} ${TOK.panelPad}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={TOK.sectionTitle}>Flujo y automatizaciones</h2>
          <p className={`mt-1 ${TOK.sectionSubtitle}`}>
            Configura pasos verticales. WhatsApp se mostrara como accion futura, no activa.
          </p>
        </div>
        <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Guardar flujo'}</Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className={TOK.label}>Trigger</span>
          <select name="trigger" defaultValue={automation?.trigger ?? 'LANDING_SUBMITTED'} className={TOK.selectLg}>
            <option value="LANDING_SUBMITTED">Registro enviado</option>
            <option value="WEBINAR_REGISTERED">Registrado al webinar</option>
          </select>
        </label>
        <label>
          <span className={TOK.label}>Estado</span>
          <select name="status" defaultValue={automation?.status ?? 'DRAFT'} className={TOK.selectLg}>
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activo</option>
            <option value="PAUSED">Pausado</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className={TOK.label}>Pasos JSON</span>
        <textarea
          name="steps"
          value={stepsText}
          onChange={(event) => setStepsText(event.target.value)}
          rows={14}
          className={`${TOK.inputNativeMultiline} font-mono`}
        />
      </label>

      <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-low)] p-4 text-sm text-[var(--color-on-surface-variant)]">
        Acciones disponibles: WAIT, ASSIGN_TAG, UPDATE_CONTACT_STATUS, CREATE_DEAL, MOVE_DEAL, SEND_EMAIL, REDIRECT.
        SEND_WHATSAPP queda para una fase futura.
      </div>

      {state?.error && <div className={`${TOK.errorBox} mt-4`}>{state.error}</div>}
    </form>
  )
}
