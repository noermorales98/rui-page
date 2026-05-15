'use client'

import { useState, useCallback, useEffect, useRef, useActionState, useMemo } from 'react'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { FunnelPage } from '@prisma/client'
import type { FunnelBlock, FunnelTheme } from '@/lib/funnels/types'
import type { FormCacheEntry } from '@/lib/funnels/types'
import { defaultConfigByType, defaultTheme } from '@/lib/funnels/defaults'
import { validateBlocks, type BlockValidationError } from '@/lib/funnels/builder-validation'
import { saveBlocksAction, getFormDetailAction } from '../actions'
import { BlockPalette } from './builder/BlockPalette'
import { BuilderCanvas } from './builder/BuilderCanvas'
import { BlockEditor } from './builder/BlockEditor'

function coerceBlocks(value: unknown): FunnelBlock[] {
  return Array.isArray(value) ? (value as FunnelBlock[]) : []
}

function coerceTheme(value: unknown): FunnelTheme {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as FunnelTheme
  }
  return defaultTheme
}

export function LandingBuilder({ page, theme }: { page: FunnelPage; theme: FunnelTheme | null | undefined }) {
  const [blocks, setBlocks] = useState<FunnelBlock[]>(() => coerceBlocks(page.blocks))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [validationErrors, setValidationErrors] = useState<BlockValidationError[]>([])
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [formsCache, setFormsCache] = useState<Record<number, FormCacheEntry>>({})
  const boundSaveAction = useMemo(() => saveBlocksAction.bind(null, page.id), [page.id])
  const [state, action, isPending] = useActionState(boundSaveAction, null)

  const formRef = useRef<HTMLFormElement>(null)
  const blocksInputRef = useRef<HTMLInputElement>(null)
  const resolvedTheme = coerceTheme(theme)

  function markDirty<T>(val: T): T {
    setIsDirty(true)
    setValidationErrors([])
    return val
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('palette-')) {
      const blockType = activeId.replace('palette-', '') as FunnelBlock['type']
      const newBlock: FunnelBlock = {
        id: crypto.randomUUID(),
        type: blockType,
        config: { ...defaultConfigByType[blockType] },
      }
      const overIndex = blocks.findIndex((b) => b.id === overId)
      const insertAt = overIndex >= 0 ? overIndex + 1 : blocks.length
      setBlocks(markDirty([...blocks.slice(0, insertAt), newBlock, ...blocks.slice(insertAt)]))
      setSelectedId(newBlock.id)
      return
    }

    if (activeId !== overId) {
      setBlocks((prev) => {
        const oldIdx = prev.findIndex((b) => b.id === activeId)
        const newIdx = prev.findIndex((b) => b.id === overId)
        if (oldIdx >= 0 && newIdx >= 0) {
          setIsDirty(true)
          setValidationErrors([])
          return arrayMove(prev, oldIdx, newIdx)
        }
        return prev
      })
    }
  }

  const handleUpdateBlock = useCallback((blockId: string, newConfig: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, config: newConfig } : b)))
    setIsDirty(true)
    setValidationErrors([])
  }, [])

  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    setSelectedId((prev) => (prev === blockId ? null : prev))
    setIsDirty(true)
  }, [])

  const triggerSave = useCallback(() => {
    const errors = validateBlocks(blocks)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    if (blocksInputRef.current) {
      blocksInputRef.current.value = JSON.stringify(blocks)
    }
    formRef.current?.requestSubmit()
  }, [blocks])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        triggerSave()
        return
      }
      if (e.key === 'Escape') {
        setSelectedId(null)
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          handleDeleteBlock(selectedId)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, triggerSave, handleDeleteBlock])

  useEffect(() => {
    const formBlocks = blocks.filter((b) => b.type === 'FORM')
    for (const b of formBlocks) {
      const formId = typeof b.config.formId === 'number' ? b.config.formId : null
      if (formId != null && !formsCache[formId]) {
        getFormDetailAction(formId).then((entry) => {
          if (entry) {
            setFormsCache((prev) => ({ ...prev, [formId]: entry }))
          }
        })
      }
    }
  }, [blocks, formsCache])

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null
  const activePaletteType = activeDragId?.startsWith('palette-')
    ? activeDragId.replace('palette-', '')
    : null

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <form
        id={`builder-form-${page.id}`}
        ref={formRef}
        action={action}
      >
        <input ref={blocksInputRef} type="hidden" name="blocks" defaultValue={JSON.stringify(blocks)} />
      </form>

      <div className="flex h-[calc(100vh-14rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)]">
        {/* Left: Palette */}
        <div className="shrink-0 overflow-y-auto border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-3">
          <BlockPalette />
        </div>

        {/* Center: Canvas */}
        <BuilderCanvas
          pageId={page.id}
          blocks={blocks}
          theme={resolvedTheme}
          selectedId={selectedId}
          validationErrors={validationErrors}
          isDirty={isDirty}
          isPending={isPending}
          onSelect={setSelectedId}
          onDelete={handleDeleteBlock}
          onSave={triggerSave}
          formsCache={formsCache}
        />

        {/* Right: Properties */}
        <div className="w-60 shrink-0 overflow-y-auto border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-4">
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onUpdate={handleUpdateBlock}
              onDelete={handleDeleteBlock}
            />
          ) : (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Selecciona un bloque del canvas para editar sus propiedades.
            </p>
          )}
        </div>
      </div>

      <DragOverlay>
        {activePaletteType && (
          <div className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-on-primary)] shadow-lg">
            + {activePaletteType}
          </div>
        )}
      </DragOverlay>

      {state?.error && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]">
          {state.error}
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]">
          Hay {validationErrors.length} bloque(s) con errores. Corrígelos antes de guardar.
        </div>
      )}
    </DndContext>
  )
}
