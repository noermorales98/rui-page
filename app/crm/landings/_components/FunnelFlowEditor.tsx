'use client'

import { useState, useTransition } from 'react'
import type { Flow, FlowStep } from '@prisma/client'
import { HugeiconsIcon } from '@hugeicons/react'
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import Tag01Icon from '@hugeicons/core-free-icons/Tag01Icon'
import LinkSquare01Icon from '@hugeicons/core-free-icons/LinkSquare01Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import Edit02Icon from '@hugeicons/core-free-icons/Edit02Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import FlashIcon from '@hugeicons/core-free-icons/FlashIcon'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { saveFlowAction } from '../actions'
import {
  type VisualStep,
  visualStepsToService,
  serviceStepsToVisual,
} from '@/lib/funnels/flow-steps'

type Automation = Flow & { steps: FlowStep[] }

type StepType = 'email' | 'wait' | 'tag' | 'webhook'

const STEP_META: Record<StepType, { icon: typeof Mail01Icon; label: string }> = {
  email:   { icon: Mail01Icon,       label: 'Enviar correo'  },
  wait:    { icon: Clock01Icon,      label: 'Esperar'        },
  tag:     { icon: Tag01Icon,        label: 'Etiquetar'      },
  webhook: { icon: LinkSquare01Icon, label: 'Webhook'        },
}

function stepSummary(step: VisualStep): string {
  if (step.type === 'email')   return step.subject ? `"${step.subject}"` : 'Sin asunto'
  if (step.type === 'wait')    return `${step.amount} ${step.unit === 'hours' ? 'hora(s)' : 'día(s)'}`
  if (step.type === 'tag')     return step.tag || 'Sin etiqueta'
  if (step.type === 'webhook') return step.url || 'Sin URL'
  return ''
}

function defaultStep(type: StepType): VisualStep {
  const id = crypto.randomUUID()
  if (type === 'email')   return { id, type: 'email',   subject: '', body: '' }
  if (type === 'wait')    return { id, type: 'wait',    amount: 1, unit: 'days' }
  if (type === 'tag')     return { id, type: 'tag',     tag: '' }
  return { id, type: 'webhook', url: '', method: 'POST' }
}

function StepForm({
  step,
  onChange,
}: {
  step: VisualStep
  onChange: (updated: VisualStep) => void
}) {
  if (step.type === 'email') {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <input
          className={TOK.inputNative}
          placeholder="Asunto del correo"
          value={step.subject}
          onChange={(e) => onChange({ ...step, subject: e.target.value })}
        />
        <textarea
          className={TOK.inputNativeMultiline}
          placeholder="Cuerpo del mensaje"
          rows={4}
          value={step.body}
          onChange={(e) => onChange({ ...step, body: e.target.value })}
        />
      </div>
    )
  }
  if (step.type === 'wait') {
    return (
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          min={1}
          className={`${TOK.inputNative} w-24`}
          value={step.amount}
          onChange={(e) => onChange({ ...step, amount: Math.max(1, Number(e.target.value)) })}
        />
        <select
          className={TOK.inputNative}
          value={step.unit}
          onChange={(e) => onChange({ ...step, unit: e.target.value as 'hours' | 'days' })}
        >
          <option value="hours">Horas</option>
          <option value="days">Días</option>
        </select>
      </div>
    )
  }
  if (step.type === 'tag') {
    return (
      <div className="mt-2">
        <input
          className={TOK.inputNative}
          placeholder="Nombre de la etiqueta"
          value={step.tag}
          onChange={(e) => onChange({ ...step, tag: e.target.value })}
        />
      </div>
    )
  }
  if (step.type === 'webhook') {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <input
          className={TOK.inputNative}
          placeholder="https://tu-endpoint.com/webhook"
          value={step.url}
          onChange={(e) => onChange({ ...step, url: e.target.value })}
        />
        <select
          className={TOK.inputNative}
          value={step.method}
          onChange={(e) => onChange({ ...step, method: e.target.value as 'POST' | 'GET' })}
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
        </select>
      </div>
    )
  }
  return null
}

export function FunnelFlowEditor({
  funnelId,
  automations,
}: {
  funnelId: number
  automations: Automation[]
}) {
  const automation = automations[0]

  const initialSteps = automation?.steps.length
    ? serviceStepsToVisual(
        automation.steps.map((s) => ({
          action: s.action ?? '',
          delayMins: s.delayMins ?? 0,
          config: (s.config ?? {}) as Record<string, unknown>,
        })),
      )
    : []

  const [trigger, setTrigger] = useState<'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED'>(
    (automation?.trigger as 'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED') ?? 'LANDING_SUBMITTED',
  )
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'PAUSED'>(
    (automation?.status as 'DRAFT' | 'ACTIVE' | 'PAUSED') ?? 'DRAFT',
  )
  const [steps, setSteps] = useState<VisualStep[]>(initialSteps)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function addStep(type: StepType) {
    setShowAddMenu(false)
    setSteps((prev) => [...prev, defaultStep(type)])
  }

  function updateStep(updated: VisualStep) {
    setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const serviceSteps = visualStepsToService(steps)
      const result = await saveFlowAction(funnelId, trigger, status, serviceSteps)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className={`${TOK.panel} ${TOK.panelPad}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={TOK.sectionTitle}>Flujo y automatizaciones</h2>
          <p className={`mt-1 ${TOK.sectionSubtitle}`}>
            Configura lo que ocurre automáticamente cuando alguien se registra.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className={TOK.inputNative}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'PAUSED')}
          >
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activo</option>
            <option value="PAUSED">Pausado</option>
          </select>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)] disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar flujo'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-0">
        {/* Trigger */}
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)] bg-[var(--color-primary-container,#e8f0fe)] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)]">
            <HugeiconsIcon icon={FlashIcon} size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Disparador</span>
            <select
              className="border-0 bg-transparent text-sm font-semibold text-[var(--color-on-surface)] focus:outline-none"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as 'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED')}
            >
              <option value="LANDING_SUBMITTED">Registro completado</option>
              <option value="WEBINAR_REGISTERED">Registrado al webinar</option>
            </select>
          </div>
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const meta = STEP_META[step.type]
          const isEditing = editingId === step.id
          return (
            <div key={step.id}>
              {/* Connector */}
              <div className="ml-[1.1rem] h-6 w-0.5 bg-[var(--color-outline-variant)]" />
              {/* Step card */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
                    <HugeiconsIcon icon={meta.icon} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">{meta.label}</span>
                    <p className="truncate text-sm text-[var(--color-on-surface)]">{stepSummary(step)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : step.id)}
                      className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                      aria-label={isEditing ? 'Cerrar editor de paso' : 'Editar paso'}
                    >
                      <HugeiconsIcon icon={isEditing ? CheckmarkCircle01Icon : Edit02Icon} size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]"
                      aria-label="Eliminar paso"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <StepForm step={step} onChange={updateStep} />
                )}
              </div>
            </div>
          )
        })}

        {/* Add step */}
        <div className="relative mt-4 ml-0">
          <div className={steps.length > 0 ? 'ml-[1.1rem] h-6 w-0.5 bg-[var(--color-outline-variant)]' : 'hidden'} />
          <div className="relative inline-block" data-add-step-menu>
            <button
              type="button"
              onClick={() => setShowAddMenu((v) => !v)}
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline-variant)] px-4 py-2 text-sm text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              aria-label="Agregar paso al flujo"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              Agregar paso
            </button>
            {showAddMenu && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] py-1 shadow-lg">
                {(Object.entries(STEP_META) as [StepType, { icon: typeof Mail01Icon; label: string }][]).map(([type, meta]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addStep(type)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]"
                  >
                    <HugeiconsIcon icon={meta.icon} size={15} className="text-[var(--color-primary)]" />
                    {meta.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-tertiary-container)] px-4 py-3 text-sm text-[var(--color-on-tertiary-container)]">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
          Flujo guardado correctamente
        </div>
      )}
      {error && (
        <div className={`${TOK.errorBox} mt-4`}>{error}</div>
      )}
    </div>
  )
}
