'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FunnelBlock } from '@/lib/funnels/types'

const LABELS: Record<string, string> = {
  HERO: '⬛ Hero', TEXT: '📝 Texto', VIDEO: '🎥 Video', FORM: '📋 Formulario',
  CTA: '🔘 CTA', FAQ: '❓ FAQ', TESTIMONIALS: '⭐ Testimonios',
  WEBINAR_ROOM: '📡 Sala', FOOTER: '🔗 Footer', CUSTOM_HTML: '⌨️ HTML',
}

type Props = {
  block: FunnelBlock
  isSelected: boolean
  isInvalid: boolean
  onSelect: () => void
  onDelete: () => void
  children: React.ReactNode
}

export function SortableBlockWrapper({ block, isSelected, isInvalid, onSelect, onDelete, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const borderColor = isInvalid
    ? 'border-[var(--color-error)]'
    : isSelected
    ? 'border-[var(--color-primary)]'
    : 'border-transparent hover:border-[var(--color-outline-variant)]'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={`group relative border-2 ${borderColor} transition-colors`}
      onClick={onSelect}
    >
      <div
        className={`absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-2 py-1 text-xs font-semibold transition-opacity ${
          isSelected
            ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] opacity-100'
            : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100'
        }`}
      >
        <span>{LABELS[block.type] ?? block.type}</span>
        <div className="flex gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab px-1 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            aria-label="Arrastrar bloque"
          >
            ⠿
          </button>
          <button
            type="button"
            className="px-1 hover:text-[var(--color-error)]"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Eliminar bloque"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="pt-7">{children}</div>
    </div>
  )
}
