'use client'

import { useDraggable } from '@dnd-kit/core'
import type { FunnelBlockType } from '@/lib/funnels/types'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const ITEMS: Array<{ type: FunnelBlockType; label: string; icon: string }> = [
  { type: 'HERO',         label: 'Hero',        icon: '⬛' },
  { type: 'TEXT',         label: 'Texto',        icon: '📝' },
  { type: 'VIDEO',        label: 'Video',        icon: '🎥' },
  { type: 'FORM',         label: 'Formulario',   icon: '📋' },
  { type: 'CTA',          label: 'CTA',          icon: '🔘' },
  { type: 'FAQ',          label: 'FAQ',          icon: '❓' },
  { type: 'TESTIMONIALS', label: 'Testimonios',  icon: '⭐' },
  { type: 'FOOTER',       label: 'Footer',       icon: '🔗' },
  { type: 'CUSTOM_HTML',  label: 'HTML',         icon: '⌨️' },
]

function PaletteItem({ type, label, icon }: { type: FunnelBlockType; label: string; icon: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm select-none transition active:cursor-grabbing ${
        isDragging ? 'opacity-40' : 'hover:bg-[var(--color-surface-container-low)]'
      }`}
    >
      <span>{icon}</span>
      <span className="text-[var(--color-on-surface)]">{label}</span>
    </div>
  )
}

export function BlockPalette() {
  return (
    <aside className="flex w-44 shrink-0 flex-col gap-1">
      <p className={`${TOK.label} mb-2`}>Bloques</p>
      <p className="mb-3 text-xs text-[var(--color-on-surface-variant)]">Arrastra al canvas →</p>
      {ITEMS.map((item) => (
        <PaletteItem key={item.type} {...item} />
      ))}
    </aside>
  )
}
