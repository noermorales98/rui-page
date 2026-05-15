'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { DealStage } from '@prisma/client'
import { Plus } from 'lucide-react'
import { DealCard } from './DealCard'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'
import { Button } from '@/app/crm/_components/ui'

const STAGE_CONFIG: Record<
  DealStage,
  { title: string; hint: string; surface: 'default' | 'enrolled' }
> = {
  LEAD: {
    title: 'Lead',
    hint: 'Primer contacto y exploración',
    surface: 'default',
  },
  DEMO: {
    title: 'Demo / Llamada',
    hint: 'Sesión en vivo o llamada agendada',
    surface: 'default',
  },
  NEGOTIATION: {
    title: 'Negociación',
    hint: 'Propuesta y cierre',
    surface: 'default',
  },
  ENROLLED: {
    title: 'Inscrito',
    hint: 'Cliente confirmado',
    surface: 'enrolled',
  },
}

interface Props {
  stage: DealStage
  deals: DealWithContact[]
  onMove: (dealId: number, fromStage: DealStage, toStage: DealStage) => void
  onDelete: (dealId: number, stage: DealStage) => void
  canMutate: boolean
  canDelete: boolean
}

export function PipelineColumn({ stage, deals, onMove, onDelete, canMutate, canDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = STAGE_CONFIG[stage]

  const containerClass = (() => {
    const shell =
      'flex min-h-[min(36vh,20rem)] min-w-0 max-w-full flex-col rounded-[var(--radius-lg)] p-3 transition-colors duration-200 sm:min-h-[min(40vh,22rem)] sm:p-4 md:p-5'
    if (isOver) {
      return `${shell} bg-[var(--color-primary-fixed)]/40`
    }
    if (config.surface === 'enrolled') {
      return `${shell} bg-[var(--color-secondary-fixed)]/22`
    }
    return `${shell} bg-[var(--color-surface-container)]`
  })()

  return (
    <section ref={setNodeRef} className={containerClass} aria-labelledby={`pipeline-col-${stage}`}>
      <div className="mb-4 flex min-w-0 items-start justify-between gap-2 md:mb-5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h2
            id={`pipeline-col-${stage}`}
            className="truncate text-[0.9375rem] font-semibold leading-snug tracking-tight text-[var(--color-on-surface)] sm:text-lg"
          >
            {config.title}
            {stage === 'ENROLLED' ? (
              <span className="ml-1 text-[var(--color-tertiary)]" aria-hidden>
                ✓
              </span>
            ) : null}
          </h2>
          <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-snug tracking-wider text-[var(--color-on-surface-variant)] sm:text-xs">
            {config.hint}
          </p>
        </div>
        <span
          className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] px-2 text-xs font-semibold tabular-nums text-[var(--color-on-surface)] sm:h-9 sm:min-w-9 sm:px-3 sm:text-sm"
          aria-label={`${deals.length} oportunidades en esta etapa`}
        >
          {deals.length}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {deals.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)]/60 px-4 py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Sin oportunidades</p>
            {canMutate ? (
              <p className="mt-1 max-w-[14rem] text-xs text-[var(--color-on-surface-variant)]/90">
                Añade una desde el botón inferior o arrastra aquí una tarjeta.
              </p>
            ) : null}
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onMove={(toStage: DealStage) => onMove(deal.id, stage, toStage)}
              onDelete={() => onDelete(deal.id, stage)}
              canMutate={canMutate}
              canDelete={canDelete}
            />
          ))
        )}
      </div>

      {canMutate ? (
        <div className="mt-4 min-w-0 shrink-0 md:mt-5">
          <Button type="button" variant="secondary" size="sm" fullWidth onClick={() => setModalOpen(true)}>
            <Plus size={16} strokeWidth={2} aria-hidden />
            <span className="truncate">Añadir</span>
          </Button>
        </div>
      ) : null}

      {modalOpen ? <CreateDealModal initialStage={stage} onClose={() => setModalOpen(false)} /> : null}
    </section>
  )
}
