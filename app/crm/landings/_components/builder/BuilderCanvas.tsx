'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { FunnelBlock, FunnelTheme } from '@/lib/funnels/types'
import type { BlockValidationError } from '@/lib/funnels/builder-validation'
import { isInvalidBlock } from '@/lib/funnels/builder-validation'
import { renderFunnelBlocks } from '@/lib/funnels/render'
import { SortableBlockWrapper } from './SortableBlockWrapper'

type Props = {
  pageId: number
  blocks: FunnelBlock[]
  theme: FunnelTheme
  selectedId: string | null
  validationErrors: BlockValidationError[]
  isDirty: boolean
  isPending: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onSave: () => void
}

export function BuilderCanvas({
  pageId, blocks, theme, selectedId, validationErrors, isDirty, isPending, onSelect, onDelete, onSave,
}: Props) {
  const { setNodeRef } = useDroppable({ id: 'canvas' })

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-4 py-2">
        <span className="text-sm">
          {isDirty ? (
            <span className="font-semibold text-[var(--color-error)]">● Sin guardar</span>
          ) : (
            <span className="text-[var(--color-on-surface-variant)]">Guardado</span>
          )}
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-1.5 text-sm font-semibold text-[var(--color-on-primary)] transition disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto">
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-[var(--color-on-surface-variant)]">
              Arrastra un bloque desde la paleta para comenzar
            </div>
          ) : (
            blocks.map((block) => {
              const [rendered] = renderFunnelBlocks({ blocks: [block], theme })
              return (
                <SortableBlockWrapper
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedId}
                  isInvalid={isInvalidBlock(block.id, validationErrors)}
                  onSelect={() => onSelect(block.id)}
                  onDelete={() => onDelete(block.id)}
                >
                  {rendered}
                </SortableBlockWrapper>
              )
            })
          )}
        </SortableContext>
      </div>
    </div>
  )
}
