'use client'

import { useState, startTransition } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { DealStage } from '@prisma/client'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { deleteDeal } from '../actions'
import { CreateDealModal } from './CreateDealModal'
import { Dialog, Select, useToast } from '@/app/crm/_components/ui'
import type { DealWithContact } from './PipelineBoard'
import { Dialog, useToast } from '@/app/crm/_components/ui'

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
  canMutate: boolean
  canDelete: boolean
}

export function DealCard({ deal, onMove, onDelete, canMutate, canDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { error: toastError } = useToast()

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id, disabled: !canMutate })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
  const dragProps = canMutate ? { ...attributes, ...listeners } : {}

  function handleDelete() {
    setConfirmOpen(true)
  }

  function doDelete() {
    setConfirmOpen(false)
    onDelete()
    startTransition(async () => {
      try {
        await deleteDeal(deal.id)
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Error al archivar.')
      }
    })
  }

  return (
    <>
      <Dialog
        open={confirmOpen}
        title="¿Archivar oportunidad?"
        description={`Archivar la oportunidad de ${deal.contact.name}. Se bloqueará si tiene una venta pagada.`}
        variant="danger"
        confirmLabel="Archivar"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <div
        ref={setNodeRef}
        style={style}
        className={`min-w-0 max-w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] px-3 py-3 transition-opacity sm:px-4 sm:py-3.5 ${
          isDragging
            ? 'opacity-40'
            : canMutate
              ? 'cursor-grab active:cursor-grabbing'
              : 'cursor-default'
        }`}
        {...dragProps}
      >
        {/* Contact name + course */}
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <a
              href={`/crm/contactos/${deal.contact.id}`}
              className="block truncate text-sm font-semibold text-[var(--color-on-surface)] transition-colors hover:text-[var(--color-primary)]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {deal.contact.name}
            </a>
            {deal.courseName ? (
              <p className="mt-1 truncate text-sm text-[var(--color-on-surface-variant)]">{deal.courseName}</p>
            ) : (
              <p className="mt-1 text-sm italic text-[var(--color-on-surface-variant)]/75">sin curso</p>
            )}
          </div>

          {/* Detail / Edit / Delete buttons — stop drag events */}
          <div
            className="flex flex-shrink-0 items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Link
              href={`/crm/pipeline/${deal.id}`}
              className="rounded-lg p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
              title="Ver detalle"
            >
              <ExternalLink size={14} strokeWidth={2} />
            </Link>
            {canMutate && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
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
            )}
            {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]"
              title="Archivar"
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
            )}
          </div>
        </div>

        {/* Stage selector fallback — stops drag pointer events */}
        {canMutate && (
          <div className="mt-3 min-w-0" onPointerDown={(e) => e.stopPropagation()}>
            <Select
              value={deal.stage}
              aria-label="Mover a etapa"
              onChange={(e) => onMove(e.target.value as DealStage)}
              className="min-h-9 w-full max-w-full min-w-0 py-2 text-xs text-[var(--color-on-surface-variant)]"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <p className="mt-3 text-xs text-[var(--color-on-surface-variant)]">{relativeTime(deal.updatedAt)}</p>
      </div>

      {editOpen && (
        <CreateDealModal deal={deal} onClose={() => setEditOpen(false)} />
      )}
    </>
  )
}
