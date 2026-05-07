# CRM Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Kanban-style pipeline at `/crm/pipeline` for tracking contacts interested in buying courses through four stages: Lead → Demo/Llamada → Negociación → Inscrito.

**Architecture:** Server component loads and groups Deal records; `PipelineBoard` client component holds optimistic state and wraps everything in a `DndContext`. Each column is a `useDroppable` zone; each card is a `useDraggable`. Dropping a card calls the `moveDeal` server action inside a `startTransition`. Creating/editing deals uses `useActionState` with Zod-validated server actions.

**Tech Stack:** Next.js 16 App Router, Prisma 7 + MariaDB, React 19 `useActionState` + `startTransition`, `@dnd-kit/core` + `@dnd-kit/utilities`, Tailwind CSS v4, Zod, `@/auth` for session checks.

---

## Key Constraints

- `'use server'` files may only export `async function` declarations — no re-exports, no `export { x } from '...'`.
- `searchParams` and `params` are `Promise<...>` in Next.js 16 — must be `await`ed.
- `prisma db push` is used instead of migrations for schema changes.
- No test framework exists — verify with `npm run build` and manual browser checks.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add `DealStage` enum, `Deal` model, `deals` relation on `Contact` |
| `package.json` | Modify | Add `@dnd-kit/core` and `@dnd-kit/utilities` |
| `app/crm/pipeline/actions.ts` | Create | `createDeal`, `updateDeal`, `deleteDeal`, `moveDeal` server actions |
| `app/api/crm/contacts-search/route.ts` | Create | GET handler — returns up to 10 contacts matching query |
| `app/crm/pipeline/page.tsx` | Modify | Replace placeholder: fetch all deals, group by stage, render `PipelineBoard` |
| `app/crm/pipeline/_components/PipelineBoard.tsx` | Create | `'use client'` — `DndContext`, optimistic state, renders columns |
| `app/crm/pipeline/_components/PipelineColumn.tsx` | Create | `'use client'` — `useDroppable`, renders column header + cards + add button |
| `app/crm/pipeline/_components/DealCard.tsx` | Create | `'use client'` — `useDraggable`, renders card with stage selector, edit/delete |
| `app/crm/pipeline/_components/CreateDealModal.tsx` | Create | `'use client'` — create/edit deal form, contact search, `useActionState` |
| `app/crm/contactos/[id]/_components/ContactDeals.tsx` | Create | Server component — lists deals for this contact |
| `app/crm/contactos/[id]/_components/NewDealButton.tsx` | Create | `'use client'` — "Nueva oportunidad" button + `CreateDealModal` |
| `app/crm/contactos/[id]/page.tsx` | Modify | Add `ContactDeals` section to the contact detail layout |

---

## Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `DealStage` enum and `Deal` model to the schema**

Open `prisma/schema.prisma`. Add the following **after the last `enum` block** (after `enum ActivityType { ... }`):

```prisma
enum DealStage {
  LEAD
  DEMO
  NEGOTIATION
  ENROLLED
}

model Deal {
  id         Int       @id @default(autoincrement())
  contact    Contact   @relation(fields: [contactId], references: [id], onDelete: Cascade)
  contactId  Int
  courseName String?
  stage      DealStage @default(LEAD)
  notes      String?   @db.Text
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

- [ ] **Step 2: Add `deals` relation field to the `Contact` model**

In the `Contact` model block, after the `activities ContactActivity[]` line, add:

```prisma
  deals      Deal[]
```

- [ ] **Step 3: Push schema to the database**

```bash
cd /Users/noeli/Documents/Develop/rui
npx prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` in output.

- [ ] **Step 5: Verify TypeScript can import `DealStage`**

```bash
node -e "const { DealStage } = require('@prisma/client'); console.log(Object.keys(DealStage))"
```

Expected output: `[ 'LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED' ]`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(pipeline): add Deal model and DealStage enum"
```

---

## Task 2: Install @dnd-kit Dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install packages**

```bash
cd /Users/noeli/Documents/Develop/rui
npm install @dnd-kit/core @dnd-kit/utilities
```

Expected: packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Verify TypeScript types are available**

```bash
node -e "require('@dnd-kit/core'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(pipeline): add @dnd-kit dependencies"
```

---

## Task 3: Server Actions

**Files:**
- Create: `app/crm/pipeline/actions.ts`

- [ ] **Step 1: Create the actions file**

Create `app/crm/pipeline/actions.ts` with this exact content:

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { DealStage } from '@prisma/client'

const dealSchema = z.object({
  contactId: z.coerce.number().positive('Selecciona un contacto'),
  courseName: z.string().optional(),
  stage: z.enum(['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED']).default('LEAD'),
  notes: z.string().optional(),
})

type DealState = { error: string } | null

export async function createDeal(
  prevState: DealState,
  formData: FormData,
): Promise<DealState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    contactId: formData.get('contactId'),
    courseName: (formData.get('courseName') as string) || undefined,
    stage: (formData.get('stage') as string) || 'LEAD',
    notes: (formData.get('notes') as string) || undefined,
  }

  const parsed = dealSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  await prisma.deal.create({
    data: {
      contactId: parsed.data.contactId,
      courseName: parsed.data.courseName ?? null,
      stage: parsed.data.stage,
      notes: parsed.data.notes ?? null,
    },
  })

  revalidatePath('/crm/pipeline')
  revalidatePath(`/crm/contactos/${parsed.data.contactId}`)
  return null
}

export async function updateDeal(
  dealId: number,
  prevState: DealState,
  formData: FormData,
): Promise<DealState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    contactId: formData.get('contactId'),
    courseName: (formData.get('courseName') as string) || undefined,
    stage: (formData.get('stage') as string) || 'LEAD',
    notes: (formData.get('notes') as string) || undefined,
  }

  const parsed = dealSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      courseName: parsed.data.courseName ?? null,
      stage: parsed.data.stage,
      notes: parsed.data.notes ?? null,
    },
  })

  revalidatePath('/crm/pipeline')
  revalidatePath(`/crm/contactos/${parsed.data.contactId}`)
  return null
}

export async function deleteDeal(dealId: number): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { contactId: true },
  })

  try {
    await prisma.deal.delete({ where: { id: dealId } })
  } catch (err: unknown) {
    if (
      !(
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      )
    ) {
      throw err
    }
  }

  revalidatePath('/crm/pipeline')
  if (deal) revalidatePath(`/crm/contactos/${deal.contactId}`)
}

export async function moveDeal(dealId: number, stage: DealStage): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  await prisma.deal.update({
    where: { id: dealId },
    data: { stage },
  })

  revalidatePath('/crm/pipeline')
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/noeli/Documents/Develop/rui
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors mentioning `app/crm/pipeline/actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/crm/pipeline/actions.ts
git commit -m "feat(pipeline): add server actions (createDeal, updateDeal, deleteDeal, moveDeal)"
```

---

## Task 4: Contacts Search API Route

**Files:**
- Create: `app/api/crm/contacts-search/route.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /Users/noeli/Documents/Develop/rui/app/api/crm/contacts-search
```

Create `app/api/crm/contacts-search/route.ts`:

```typescript
import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json([], { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''

  const contacts = await prisma.contact.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {},
    select: { id: true, name: true, email: true },
    take: 10,
    orderBy: { name: 'asc' },
  })

  return Response.json(contacts)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "contacts-search"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add app/api/crm/contacts-search/route.ts
git commit -m "feat(pipeline): add /api/crm/contacts-search route"
```

---

## Task 5: Pipeline Page (Server Component)

**Files:**
- Modify: `app/crm/pipeline/page.tsx`
- Create: `app/crm/pipeline/_components/` directory

- [ ] **Step 1: Create the `_components` directory**

```bash
mkdir -p /Users/noeli/Documents/Develop/rui/app/crm/pipeline/_components
```

- [ ] **Step 2: Replace `app/crm/pipeline/page.tsx`**

Write the following content (overwrites the placeholder):

```typescript
import { prisma } from '@/lib/prisma'
import type { DealStage } from '@prisma/client'
import { PipelineBoard } from './_components/PipelineBoard'
import type { DealWithContact } from './_components/PipelineBoard'

const STAGES: DealStage[] = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED']

export default async function PipelinePage() {
  const deals = await prisma.deal.findMany({
    include: {
      contact: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const grouped = STAGES.reduce<Record<DealStage, DealWithContact[]>>(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage)
      return acc
    },
    {} as Record<DealStage, DealWithContact[]>,
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="mt-1 text-sm text-gray-500">Seguimiento de oportunidades de venta</p>
      </div>
      <PipelineBoard initialDeals={grouped} />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "pipeline/page"
```

Expected: no output. (The `PipelineBoard` import will error until Task 6 — that's expected.)

- [ ] **Step 4: Commit**

```bash
git add app/crm/pipeline/page.tsx app/crm/pipeline/_components/
git commit -m "feat(pipeline): add pipeline page server component"
```

---

## Task 6: PipelineBoard Component

**Files:**
- Create: `app/crm/pipeline/_components/PipelineBoard.tsx`

- [ ] **Step 1: Create `PipelineBoard.tsx`**

```typescript
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

type GroupedDeals = Record<DealStage, DealWithContact[]>

const STAGES: DealStage[] = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED']

export function PipelineBoard({ initialDeals }: { initialDeals: GroupedDeals }) {
  const [deals, setDeals] = useState<GroupedDeals>(initialDeals)
  const [activeId, setActiveId] = useState<number | null>(null)

  // Sync when server re-renders with new data (after revalidatePath)
  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const dealId = Number(active.id)
    const newStage = over.id as DealStage

    // Only accept drops onto stage columns (string IDs), not other cards
    if (!STAGES.includes(newStage)) return

    let currentStage: DealStage | null = null
    let deal: DealWithContact | null = null

    for (const stage of STAGES) {
      const found = deals[stage].find((d) => d.id === dealId)
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
      [newStage]: [{ ...deal!, stage: newStage }, ...d[newStage]],
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
    const deal = deals[fromStage].find((d) => d.id === dealId)
    if (!deal || fromStage === toStage) return

    const snapshot = deals

    setDeals((d) => ({
      ...d,
      [fromStage]: d[fromStage].filter((x) => x.id !== dealId),
      [toStage]: [{ ...deal, stage: toStage }, ...d[toStage]],
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
    ? STAGES.flatMap((s) => deals[s]).find((d) => d.id === activeId) ?? null
    : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            deals={deals[stage]}
            onMove={handleMoveCard}
            onDelete={handleDeleteCard}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? (
          <div className="w-72 cursor-grabbing rounded-lg bg-white px-4 py-3 shadow-xl ring-1 ring-indigo-300 opacity-90">
            <p className="truncate text-sm font-semibold text-gray-900">
              {activeDeal.contact.name}
            </p>
            {activeDeal.courseName ? (
              <p className="mt-0.5 truncate text-xs text-gray-500">{activeDeal.courseName}</p>
            ) : (
              <p className="mt-0.5 text-xs italic text-gray-400">sin curso</p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "PipelineBoard"
```

Expected: no errors. (PipelineColumn and DealCard imports will fail until the next tasks — that's expected for now.)

- [ ] **Step 3: Commit**

```bash
git add app/crm/pipeline/_components/PipelineBoard.tsx
git commit -m "feat(pipeline): add PipelineBoard client component with DndContext"
```

---

## Task 7: PipelineColumn Component

**Files:**
- Create: `app/crm/pipeline/_components/PipelineColumn.tsx`

- [ ] **Step 1: Create `PipelineColumn.tsx`**

```typescript
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
            onMove={(toStage) => onMove(deal.id, stage, toStage)}
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "PipelineColumn"
```

Expected: no errors. (DealCard and CreateDealModal not yet created — ignore those import errors for now.)

- [ ] **Step 3: Commit**

```bash
git add app/crm/pipeline/_components/PipelineColumn.tsx
git commit -m "feat(pipeline): add PipelineColumn component with useDroppable"
```

---

## Task 8: DealCard Component

**Files:**
- Create: `app/crm/pipeline/_components/DealCard.tsx`

- [ ] **Step 1: Create `DealCard.tsx`**

```typescript
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
        className={`rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200 transition-opacity ${
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
              className="block truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
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
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
            className="w-full rounded border-0 bg-gray-50 py-1 text-xs text-gray-600 ring-1 ring-gray-200 focus:outline-none focus:ring-indigo-400"
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "DealCard"
```

Expected: no errors. (CreateDealModal import will fail until Task 9.)

- [ ] **Step 3: Commit**

```bash
git add app/crm/pipeline/_components/DealCard.tsx
git commit -m "feat(pipeline): add DealCard with useDraggable and stage selector"
```

---

## Task 9: CreateDealModal Component

**Files:**
- Create: `app/crm/pipeline/_components/CreateDealModal.tsx`

- [ ] **Step 1: Create `CreateDealModal.tsx`**

```typescript
'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import type { DealStage } from '@prisma/client'
import { createDeal, updateDeal } from '../actions'
import type { DealWithContact } from './PipelineBoard'

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEMO', label: 'Demo / Llamada' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ENROLLED', label: 'Inscrito' },
]

interface ContactOption {
  id: number
  name: string
  email: string
}

interface Props {
  deal?: DealWithContact
  initialStage?: DealStage
  lockedContact?: { id: number; name: string }
  onClose: () => void
}

export function CreateDealModal({ deal, initialStage, lockedContact, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [searchQuery, setSearchQuery] = useState(
    deal?.contact.name ?? lockedContact?.name ?? '',
  )
  const [searchResults, setSearchResults] = useState<ContactOption[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(
    deal
      ? { id: deal.contact.id, name: deal.contact.name, email: deal.contact.email }
      : lockedContact
        ? { id: lockedContact.id, name: lockedContact.name, email: '' }
        : null,
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isContactLocked = Boolean(deal || lockedContact)

  const action = deal ? updateDeal.bind(null, deal.id) : createDeal
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state === null && submitted) {
      onClose()
    }
  }, [state, submitted, onClose])

  useEffect(() => {
    if (isContactLocked) return

    if (searchTimer.current) clearTimeout(searchTimer.current)

    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/crm/contacts-search?q=${encodeURIComponent(searchQuery)}`,
        )
        if (res.ok) {
          const data = (await res.json()) as ContactOption[]
          setSearchResults(data)
          setShowDropdown(data.length > 0)
        }
      } catch {
        // network error — ignore
      }
    }, 300)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery, isContactLocked])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {deal ? 'Editar oportunidad' : 'Nueva oportunidad'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <form action={formAction} onSubmit={() => setSubmitted(true)}>
          {/* Contact */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contacto <span className="text-red-500">*</span>
            </label>
            <input type="hidden" name="contactId" value={selectedContact?.id ?? ''} />
            {isContactLocked ? (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {searchQuery}
              </p>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (selectedContact && e.target.value !== selectedContact.name) {
                      setSelectedContact(null)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
                {showDropdown && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {searchResults.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setSelectedContact(c)
                            setSearchQuery(c.name)
                            setShowDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{c.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{c.email}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Course name */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Curso{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              name="courseName"
              defaultValue={deal?.courseName ?? ''}
              placeholder="ej. Presencia Escénica"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* Stage */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Etapa</label>
            <select
              name="stage"
              defaultValue={deal?.stage ?? initialStage ?? 'LEAD'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notas{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="notes"
              defaultValue={deal?.notes ?? ''}
              rows={3}
              placeholder="Observaciones sobre esta oportunidad..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="mb-3 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || (!isContactLocked && !selectedContact)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? 'Guardando...' : deal ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors. All pipeline components are now defined.

- [ ] **Step 3: Build to verify no runtime bundling issues**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds. Fix any TypeScript or import errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add app/crm/pipeline/_components/CreateDealModal.tsx
git commit -m "feat(pipeline): add CreateDealModal with contact search"
```

---

## Task 10: Contact Detail Integration

**Files:**
- Create: `app/crm/contactos/[id]/_components/ContactDeals.tsx`
- Create: `app/crm/contactos/[id]/_components/NewDealButton.tsx`
- Modify: `app/crm/contactos/[id]/page.tsx`

- [ ] **Step 1: Create `NewDealButton.tsx`** (client component)

```typescript
'use client'

import { useState } from 'react'
import { CreateDealModal } from '@/app/crm/pipeline/_components/CreateDealModal'

interface Props {
  contactId: number
  contactName: string
}

export function NewDealButton({ contactId, contactName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
      >
        + Nueva oportunidad
      </button>
      {open && (
        <CreateDealModal
          lockedContact={{ id: contactId, name: contactName }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Create `ContactDeals.tsx`** (server component)

```typescript
import { prisma } from '@/lib/prisma'
import type { DealStage } from '@prisma/client'
import { NewDealButton } from './NewDealButton'

const STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead',
  DEMO: 'Demo / Llamada',
  NEGOTIATION: 'Negociación',
  ENROLLED: 'Inscrito',
}

const STAGE_BADGE: Record<DealStage, string> = {
  LEAD: 'bg-indigo-100 text-indigo-800',
  DEMO: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  ENROLLED: 'bg-green-100 text-green-800',
}

interface Props {
  contactId: number
  contactName: string
}

export async function ContactDeals({ contactId, contactName }: Props) {
  const deals = await prisma.deal.findMany({
    where: { contactId },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Oportunidades</h3>
        <NewDealButton contactId={contactId} contactName={contactName} />
      </div>
      {deals.length === 0 ? (
        <p className="text-sm text-gray-400">Sin oportunidades registradas</p>
      ) : (
        <ul className="space-y-2">
          {deals.map((deal) => (
            <li
              key={deal.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-gray-900">
                {deal.courseName ?? (
                  <span className="italic text-gray-400">sin curso</span>
                )}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_BADGE[deal.stage]}`}
              >
                {STAGE_LABELS[deal.stage]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add `ContactDeals` to the contact detail page**

Open `app/crm/contactos/[id]/page.tsx`. Add `ContactDeals` import and render it inside the right column, after `<AddNoteForm>`.

The right column section currently is:
```tsx
<div className="p-6">
  <AddNoteForm contactId={contact.id} />
  <ActivityFeed activities={contact.activities} />
</div>
```

Replace that with:
```tsx
<div className="p-6">
  <ContactDeals contactId={contact.id} contactName={contact.name} />
  <div className="mt-6 border-t border-gray-100 pt-6">
    <h3 className="mb-3 text-sm font-semibold text-gray-700">Actividad</h3>
    <AddNoteForm contactId={contact.id} />
    <ActivityFeed activities={contact.activities} />
  </div>
</div>
```

Also add the import at the top:
```tsx
import { ContactDeals } from './_components/ContactDeals'
```

- [ ] **Step 4: Verify full TypeScript build**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build completes successfully.

- [ ] **Step 6: Commit**

```bash
git add \
  app/crm/contactos/[id]/_components/ContactDeals.tsx \
  app/crm/contactos/[id]/_components/NewDealButton.tsx \
  app/crm/contactos/[id]/page.tsx
git commit -m "feat(pipeline): add ContactDeals section to contact detail page"
```

---

## Verification Checklist

After all tasks are complete, verify the following manually in the browser:

- [ ] Visit `/crm/pipeline` — four columns render, empty state shows the "Añadir" button in each
- [ ] Click "Añadir" in the Lead column → modal opens with stage pre-selected as Lead
- [ ] Search for a contact in the modal → dropdown shows results after typing 2+ chars
- [ ] Create a deal → card appears in the correct column
- [ ] Drag a card to another column → moves instantly (optimistic), stage persists after reload
- [ ] Use the stage dropdown on a card → card moves to the selected stage
- [ ] Click edit on a card → modal opens pre-filled with existing data
- [ ] Click delete on a card → confirm dialog → card disappears
- [ ] Visit a contact detail page → "Oportunidades" section shows their deals
- [ ] Click "+ Nueva oportunidad" from contact detail → modal opens with contact pre-filled and locked
