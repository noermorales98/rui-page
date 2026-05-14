'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { DealStage } from '@prisma/client'
import { DealCard } from './DealCard'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'

const STAGE_CONFIG: Record<DealStage, { label: string; labelColor: string; accentBg: boolean }> = {
  LEAD:        { label: 'Lead',           labelColor: 'text-[var(--color-on-surface-variant)]', accentBg: false },
  DEMO:        { label: 'Demo / Llamada', labelColor: 'text-[var(--color-primary)]', accentBg: false },
  NEGOTIATION: { label: 'Negociación',    labelColor: 'text-[var(--color-secondary)]', accentBg: false },
  ENROLLED:    { label: 'Inscrito ✓',    labelColor: 'text-[var(--color-tertiary)]', accentBg: true  },
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

  const containerClass = [
    'flex flex-col flex-shrink-0 w-64 rounded-[22px] p-3.5 transition-colors',
    isOver
      ? 'border-2 border-[var(--color-primary-fixed)] bg-[var(--color-primary-fixed)]/15'
      : config.accentBg
        ? 'bg-[var(--color-secondary-container)]/25'
        : 'bg-[var(--color-surface-container-high)]',
  ].join(' ')

  const countBadgeClass = [
    'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
    config.accentBg
      ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]'
      : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]',
  ].join(' ')

  const addButtonClass = [
    'flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border-2 border-dashed py-2 text-xs font-sans text-[var(--color-on-surface-variant)] transition-colors hover:text-[var(--color-on-surface)] bg-transparent',
    config.accentBg
      ? 'border-[var(--color-outline)] hover:border-[var(--color-outline)]'
      : 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary-fixed)]',
  ].join(' ')

  return (
    <div ref={setNodeRef} className={containerClass}>
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] font-bold uppercase tracking-[0.06em] ${config.labelColor}`}>
          {config.label}
        </span>
        <span className={countBadgeClass}>
          {deals.length}
        </span>
      </div>

      {/* Cards area */}
      <div className="flex flex-col gap-1.5 min-h-16">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onMove={(toStage: DealStage) => onMove(deal.id, stage, toStage)}
            onDelete={() => onDelete(deal.id, stage)}
            canMutate={canMutate}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Add button (hidden for read-only roles) */}
      {canMutate && (
      <div className="mt-3">
        <button
          onClick={() => setModalOpen(true)}
          className={addButtonClass}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Añadir
        </button>
      </div>
      )}

      {modalOpen && (
        <CreateDealModal
          initialStage={stage}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
