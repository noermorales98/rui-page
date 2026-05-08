'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { DealStage } from '@prisma/client'
import { DealCard } from './DealCard'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'

const STAGE_CONFIG: Record<DealStage, { label: string; labelColor: string; accentBg: boolean }> = {
  LEAD:        { label: 'Lead',           labelColor: 'text-[#8a8a8a]', accentBg: false },
  DEMO:        { label: 'Demo / Llamada', labelColor: 'text-[#5a85cc]', accentBg: false },
  NEGOTIATION: { label: 'Negociación',    labelColor: 'text-[#c07a00]', accentBg: false },
  ENROLLED:    { label: 'Inscrito ✓',    labelColor: 'text-[#5a6a00]', accentBg: true  },
}

interface Props {
  stage: DealStage
  deals: DealWithContact[]
  onMove: (dealId: number, fromStage: DealStage, toStage: DealStage) => void
  onDelete: (dealId: number, stage: DealStage) => void
}

export function PipelineColumn({ stage, deals, onMove, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = STAGE_CONFIG[stage]

  const containerClass = [
    'flex flex-col flex-shrink-0 w-64 rounded-[22px] p-3.5 transition-colors',
    isOver
      ? 'bg-[#9bbdf7]/15 ring-2 ring-[#9bbdf7]'
      : config.accentBg
        ? 'bg-[#dfff00]/10'
        : 'bg-[#f0f1f3]',
  ].join(' ')

  const countBadgeClass = [
    'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
    config.accentBg ? 'bg-[#dfff00] text-[#080808]' : 'bg-white text-[#080808]',
  ].join(' ')

  const addButtonClass = [
    'flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed py-2 text-xs text-[#8a8a8a] hover:text-[#080808] transition-colors bg-transparent cursor-pointer font-sans',
    config.accentBg
      ? 'border-[#dfff00]/50 hover:border-[#dfff00]'
      : 'border-[#d1d5db] hover:border-[#9bbdf7]',
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
          />
        ))}
      </div>

      {/* Add button */}
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

      {modalOpen && (
        <CreateDealModal
          initialStage={stage}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
