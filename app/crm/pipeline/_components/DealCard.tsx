'use client'

import { useState, startTransition } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { DealStage } from '@prisma/client'
import { deleteDeal } from '../actions'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEMO', label: 'Demo / Llamada' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ENROLLED', label: 'Inscrito' },
]

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

interface Props {
  deal: DealWithContact
  onMove: (toStage: DealStage) => void
  onDelete: () => void
}

export function DealCard({ deal, onMove, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  function handleDelete() {
    if (!window.confirm(`¿Eliminar esta oportunidad de ${deal.contact.name}?`)) return
    onDelete()
    startTransition(async () => {
      await deleteDeal(deal.id)
    })
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-2xl px-3.5 py-3 shadow-sm transition-opacity ${
          isDragging ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'
        }`}
        {...attributes}
        {...listeners}
      >
        {/* Contact name + course */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <a
              href={`/crm/contactos/${deal.contact.id}`}
              className="block truncate text-[13px] font-semibold text-[#080808] hover:text-[#5a85cc] transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {deal.contact.name}
            </a>
            {deal.courseName ? (
              <p className="mt-0.5 truncate text-xs text-gray-500">{deal.courseName}</p>
            ) : (
              <p className="mt-0.5 text-xs italic text-gray-400">sin curso</p>
            )}
          </div>

          {/* Edit / Delete buttons — stop drag events */}
          <div
            className="flex flex-shrink-0 items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] hover:text-[#080808] transition-colors border-none bg-transparent cursor-pointer"
              title="Editar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-red-50 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
              title="Eliminar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Stage selector fallback — stops drag pointer events */}
        <div className="mt-2" onPointerDown={(e) => e.stopPropagation()}>
          <select
            value={deal.stage}
            onChange={(e) => onMove(e.target.value as DealStage)}
            className="w-full rounded-xl border-0 bg-[#f0f1f3] py-1 px-2 text-xs text-[#8a8a8a] focus:outline-none focus:ring-1 focus:ring-[#dfff00] cursor-pointer"
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-2 text-xs text-gray-400">{relativeTime(deal.updatedAt)}</p>
      </div>

      {editOpen && (
        <CreateDealModal deal={deal} onClose={() => setEditOpen(false)} />
      )}
    </>
  )
}
