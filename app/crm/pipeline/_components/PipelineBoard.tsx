'use client'

import { useState, startTransition, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DealStage, Deal, Contact } from '@prisma/client'
import { PipelineColumn } from './PipelineColumn'
import { moveDeal } from '../actions'

export type DealWithContact = Deal & {
  contact: Pick<Contact, 'id' | 'name' | 'email'>
}

type GroupedDeals = Record<string, DealWithContact[]>

interface Props {
  initialDeals: GroupedDeals
  canMutate: boolean
  canDelete: boolean
  stages: DealStage[]
}

export function PipelineBoard({ initialDeals, canMutate, canDelete, stages }: Props) {
  const [deals, setDeals] = useState<GroupedDeals>(initialDeals)
  const [activeId, setActiveId] = useState<number | null>(null)

  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    if (!canMutate) return
    setActiveId(Number(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!canMutate || !over) return

    const dealId = Number(active.id)
    const newStage = over.id as DealStage
    if (!stages.includes(newStage)) return

    let currentStage: DealStage | null = null
    let deal: DealWithContact | null = null
    for (const stage of stages) {
      const found = deals[stage]?.find((d) => d.id === dealId)
      if (found) {
        currentStage = stage
        deal = found
        break
      }
    }
    if (!deal || !currentStage || currentStage === newStage) return

    const snapshot = deals

    setDeals((d) => ({
      ...d,
      [currentStage!]: d[currentStage!].filter((x) => x.id !== dealId),
      [newStage]: [{ ...deal!, stage: newStage }, ...(d[newStage] ?? [])],
    }))

    startTransition(async () => {
      try {
        await moveDeal(dealId, newStage)
      } catch {
        setDeals(snapshot)
      }
    })
  }

  function handleMoveCard(dealId: number, fromStage: DealStage, toStage: DealStage) {
    if (!canMutate) return
    const deal = deals[fromStage]?.find((d) => d.id === dealId)
    if (!deal || fromStage === toStage) return

    const snapshot = deals

    setDeals((d) => ({
      ...d,
      [fromStage]: d[fromStage].filter((x) => x.id !== dealId),
      [toStage]: [{ ...deal, stage: toStage }, ...(d[toStage] ?? [])],
    }))

    startTransition(async () => {
      try {
        await moveDeal(dealId, toStage)
      } catch {
        setDeals(snapshot)
      }
    })
  }

  function handleDeleteCard(dealId: number, stage: DealStage) {
    setDeals((d) => ({
      ...d,
      [stage]: d[stage].filter((x) => x.id !== dealId),
    }))
  }

  const activeDeal = activeId
    ? stages.flatMap((s) => deals[s] ?? []).find((d) => d.id === activeId) ?? null
    : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="w-full min-w-0 pb-2">
        <div className="grid w-full min-w-0 gap-2 [grid-template-columns:repeat(4,minmax(0,1fr))] sm:gap-3 md:gap-4">
          {stages.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              deals={deals[stage] ?? []}
              onMove={handleMoveCard}
              onDelete={handleDeleteCard}
              canMutate={canMutate}
              canDelete={canDelete}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeDeal ? (
          <div className="w-[min(100vw-2rem,22rem)] cursor-grabbing rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] px-4 py-3.5 opacity-95">
            <p className="truncate text-sm font-semibold text-[var(--color-on-surface)]">{activeDeal.contact.name}</p>
            {activeDeal.courseName ? (
              <p className="mt-1 truncate text-xs text-[var(--color-on-surface-variant)]">{activeDeal.courseName}</p>
            ) : (
              <p className="mt-1 text-xs italic text-[var(--color-on-surface-variant)]/80">sin curso</p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
