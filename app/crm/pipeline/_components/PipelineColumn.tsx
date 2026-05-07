'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { DealStage } from '@prisma/client'
import { DealCard } from './DealCard'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'

const STAGE_CONFIG: Record<DealStage, { label: string; badgeClass: string }> = {
  LEAD: {
    label: 'Lead',
    badgeClass: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200',
  },
  DEMO: {
    label: 'Demo / Llamada',
    badgeClass: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200',
  },
  NEGOTIATION: {
    label: 'Negociación',
    badgeClass: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
  },
  ENROLLED: {
    label: 'Inscrito',
    badgeClass: 'bg-green-100 text-green-800 ring-1 ring-green-200',
  },
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

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 flex-shrink-0 flex-col rounded-xl transition-colors ${
        isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-gray-100'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}
        >
          {config.label}
        </span>
        <span className="min-w-5 text-center text-xs font-medium text-gray-500">
          {deals.length}
        </span>
      </div>

      {/* Cards area */}
      <div className="flex min-h-20 flex-col gap-2 px-3 pb-3">
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
      <div className="px-3 pb-3">
        <button
          onClick={() => setModalOpen(true)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
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
