# Webinar Seguimiento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la vista `/crm/webinars/[id]/seguimiento` — pantalla de seguimiento comercial que permite filtrar registrados por estado, cambiar estado comercial inline y ejecutar acciones rápidas (notas, oportunidades, WhatsApp) sin salir de la pantalla.

**Architecture:** Server component fetches all registration data (contact, activities, deals, sales) in one Prisma query and passes it as props to a client table. Filters are applied client-side with `useState`. Mutations use Server Actions with optimistic updates, following the same pattern as `ParticipantsTable`.

**Tech Stack:** Next.js App Router, Prisma 7, TypeScript, Node.js built-in test runner (`tsx --test`), Tailwind CSS v4 con tokens Material-style en `TOK`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `CommercialStatus` enum + field on `WebinarRegistration` |
| `app/crm/webinars/[id]/seguimiento/_lib/seguimiento.ts` | Create | Pure logic: `RegistrationRow` type, `calcLeadScore`, `applyFilter`, `calcMetrics` |
| `app/crm/webinars/[id]/seguimiento/_lib/seguimiento.test.ts` | Create | Tests for `calcLeadScore` and `applyFilter` |
| `app/crm/webinars/[id]/seguimiento/actions.ts` | Create | Server Actions: `updateCommercialStatus`, `createDealForContact`, `moveDealStage`, `addNoteToContact` |
| `app/crm/webinars/[id]/seguimiento/_components/SeguimientoMetrics.tsx` | Create | 7 stat cards, receives pre-computed metrics |
| `app/crm/webinars/[id]/seguimiento/_components/CreateDealModal.tsx` | Create | Modal to create a Deal for a contact |
| `app/crm/webinars/[id]/seguimiento/_components/AddNoteModal.tsx` | Create | Modal to add a ContactActivity note |
| `app/crm/webinars/[id]/seguimiento/_components/RowActionsMenu.tsx` | Create | Dropdown with 10 quick actions per row |
| `app/crm/webinars/[id]/seguimiento/_components/SeguimientoTable.tsx` | Create | Client component: filter state, filter chips, table, row actions |
| `app/crm/webinars/[id]/seguimiento/page.tsx` | Create | Server component: Prisma fetch + render |
| `app/crm/webinars/[id]/page.tsx` | Modify | Add "Seguimiento" link to tab bar |

---

## Task 1: Prisma schema migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `CommercialStatus` enum and field to schema**

Open `prisma/schema.prisma`. After the `RegistrationStatus` enum (around the webinar section), add:

```prisma
enum CommercialStatus {
  SIN_CONTACTAR
  CONTACTADO
  INTERESADO
  PLAN_PAGOS
  NO_RESPONDE
  DESCARTADO
}
```

Then in `model WebinarRegistration`, add after `registrationDates`:

```prisma
  commercialStatus      CommercialStatus   @default(SIN_CONTACTAR)
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_commercial_status
```

Expected output: `The following migration(s) have been created and applied...`

- [ ] **Step 3: Verify Prisma client was regenerated**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `CommercialStatus`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add CommercialStatus enum to WebinarRegistration"
```

---

## Task 2: Pure logic lib + tests

**Files:**
- Create: `app/crm/webinars/[id]/seguimiento/_lib/seguimiento.ts`
- Create: `app/crm/webinars/[id]/seguimiento/_lib/seguimiento.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/crm/webinars/[id]/seguimiento/_lib/seguimiento.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calcLeadScore,
  applyFilter,
  calcMetrics,
  type RegistrationRow,
} from './seguimiento'

function makeRow(overrides: Partial<RegistrationRow> = {}): RegistrationRow {
  return {
    id: 1,
    status: 'REGISTERED',
    commercialStatus: 'SIN_CONTACTAR',
    createdAt: new Date(),
    contactId: 10,
    registrationCount: 1,
    registrationDates: [],
    contact: {
      id: 10,
      name: 'Ana',
      email: 'ana@test.com',
      phone: null,
      activities: [],
      deals: [],
    },
    ...overrides,
  }
}

// calcLeadScore
test('PURCHASED → CALIENTE', () => {
  assert.equal(calcLeadScore(makeRow({ status: 'PURCHASED' })), 'CALIENTE')
})

test('ATTENDED + INTERESADO → CALIENTE', () => {
  assert.equal(
    calcLeadScore(makeRow({ status: 'ATTENDED', commercialStatus: 'INTERESADO' })),
    'CALIENTE',
  )
})

test('ATTENDED + PLAN_PAGOS → CALIENTE', () => {
  assert.equal(
    calcLeadScore(makeRow({ status: 'ATTENDED', commercialStatus: 'PLAN_PAGOS' })),
    'CALIENTE',
  )
})

test('NO_RESPONDE → FRIO', () => {
  assert.equal(calcLeadScore(makeRow({ commercialStatus: 'NO_RESPONDE' })), 'FRIO')
})

test('DESCARTADO → FRIO', () => {
  assert.equal(calcLeadScore(makeRow({ commercialStatus: 'DESCARTADO' })), 'FRIO')
})

test('ATTENDED sin estado especial → TIBIO', () => {
  assert.equal(calcLeadScore(makeRow({ status: 'ATTENDED' })), 'TIBIO')
})

test('REGISTERED sin estado especial → TIBIO', () => {
  assert.equal(calcLeadScore(makeRow()), 'TIBIO')
})

// applyFilter
test('filter todos devuelve todos', () => {
  const rows = [makeRow({ status: 'REGISTERED' }), makeRow({ id: 2, status: 'ATTENDED' })]
  assert.equal(applyFilter(rows, 'todos').length, 2)
})

test('filter asistieron incluye ATTENDED y PURCHASED', () => {
  const rows = [
    makeRow({ status: 'REGISTERED' }),
    makeRow({ id: 2, status: 'ATTENDED' }),
    makeRow({ id: 3, status: 'PURCHASED' }),
  ]
  const result = applyFilter(rows, 'asistieron')
  assert.equal(result.length, 2)
  assert.ok(result.every((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED'))
})

test('filter sin_contactar', () => {
  const rows = [
    makeRow({ commercialStatus: 'SIN_CONTACTAR' }),
    makeRow({ id: 2, commercialStatus: 'CONTACTADO' }),
  ]
  const result = applyFilter(rows, 'sin_contactar')
  assert.equal(result.length, 1)
  assert.equal(result[0].commercialStatus, 'SIN_CONTACTAR')
})

test('filter caliente', () => {
  const rows = [
    makeRow({ status: 'PURCHASED' }),
    makeRow({ id: 2, status: 'REGISTERED' }),
  ]
  const result = applyFilter(rows, 'caliente')
  assert.equal(result.length, 1)
})

// calcMetrics
test('calcMetrics cuenta correctamente', () => {
  const rows = [
    makeRow({ status: 'REGISTERED' }),
    makeRow({ id: 2, status: 'ATTENDED' }),
    makeRow({ id: 3, status: 'PURCHASED', contact: { id: 30, name: 'C', email: 'c@t.com', phone: null, activities: [], deals: [{ id: 1, stage: 'ENROLLED', courseName: null, sales: [{ amountCents: 50000 }] }] } }),
  ]
  const m = calcMetrics(rows)
  assert.equal(m.total, 3)
  assert.equal(m.attended, 2)
  assert.equal(m.notAttended, 1)
  assert.equal(m.purchased, 1)
  assert.equal(m.revenueCents, 50000)
  assert.equal(m.hotLeads, 1)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx tsx --test "app/crm/webinars/[id]/seguimiento/_lib/seguimiento.test.ts"
```

Expected: `Error: Cannot find module './seguimiento'`

- [ ] **Step 3: Implement the lib**

Create `app/crm/webinars/[id]/seguimiento/_lib/seguimiento.ts`:

```ts
import type { CommercialStatus, DealStage, RegistrationStatus } from '@prisma/client'

export type DealRow = {
  id: number
  stage: DealStage
  courseName: string | null
  sales: { amountCents: number }[]
}

export type RegistrationRow = {
  id: number
  status: RegistrationStatus
  commercialStatus: CommercialStatus
  createdAt: Date | string
  contactId: number
  registrationCount: number
  registrationDates: unknown
  contact: {
    id: number
    name: string
    email: string
    phone: string | null
    activities: { id: number; createdAt: Date | string; type: string }[]
    deals: DealRow[]
  }
}

export type LeadScore = 'CALIENTE' | 'TIBIO' | 'FRIO'

export function calcLeadScore(row: RegistrationRow): LeadScore {
  if (row.status === 'PURCHASED') return 'CALIENTE'
  if (row.status === 'ATTENDED' && (row.commercialStatus === 'INTERESADO' || row.commercialStatus === 'PLAN_PAGOS')) return 'CALIENTE'
  if (row.commercialStatus === 'NO_RESPONDE' || row.commercialStatus === 'DESCARTADO') return 'FRIO'
  return 'TIBIO'
}

export type FilterKey =
  | 'todos'
  | 'registrados'
  | 'asistieron'
  | 'no_asistieron'
  | 'compraron'
  | 'no_compraron'
  | 'contactados'
  | 'sin_contactar'
  | 'caliente'
  | 'plan_pagos'

export function applyFilter(rows: RegistrationRow[], filter: FilterKey): RegistrationRow[] {
  switch (filter) {
    case 'todos': return rows
    case 'registrados': return rows.filter((r) => r.status === 'REGISTERED')
    case 'asistieron': return rows.filter((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED')
    case 'no_asistieron': return rows.filter((r) => r.status === 'REGISTERED')
    case 'compraron': return rows.filter((r) => r.status === 'PURCHASED')
    case 'no_compraron': return rows.filter((r) => r.status !== 'PURCHASED')
    case 'contactados': return rows.filter((r) => r.commercialStatus !== 'SIN_CONTACTAR')
    case 'sin_contactar': return rows.filter((r) => r.commercialStatus === 'SIN_CONTACTAR')
    case 'caliente': return rows.filter((r) => calcLeadScore(r) === 'CALIENTE')
    case 'plan_pagos': return rows.filter((r) => r.commercialStatus === 'PLAN_PAGOS')
  }
}

export type SeguimientoMetrics = {
  total: number
  attended: number
  notAttended: number
  purchased: number
  conversionPct: number
  revenueCents: number
  hotLeads: number
}

export function calcMetrics(rows: RegistrationRow[]): SeguimientoMetrics {
  const total = rows.length
  const attended = rows.filter((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED').length
  const purchased = rows.filter((r) => r.status === 'PURCHASED').length
  const hotLeads = rows.filter((r) => calcLeadScore(r) === 'CALIENTE').length
  const revenueCents = rows.flatMap((r) => r.contact.deals.flatMap((d) => d.sales)).reduce((sum, s) => sum + s.amountCents, 0)
  return {
    total,
    attended,
    notAttended: total - attended,
    purchased,
    conversionPct: attended > 0 ? Math.round((purchased / attended) * 100) : 0,
    revenueCents,
    hotLeads,
  }
}
```

- [ ] **Step 4: Run tests — all must pass**

```bash
npx tsx --test "app/crm/webinars/[id]/seguimiento/_lib/seguimiento.test.ts"
```

Expected: `pass 12` (or similar), `fail 0`

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/crm/webinars/[id]/seguimiento/_lib/"
git commit -m "feat: add seguimiento pure logic lib with tests"
```

---

## Task 3: Server Actions

**Files:**
- Create: `app/crm/webinars/[id]/seguimiento/actions.ts`

- [ ] **Step 1: Create the actions file**

Create `app/crm/webinars/[id]/seguimiento/actions.ts`:

```ts
'use server'

import type { CommercialStatus, DealStage } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  moveDeal as moveDealService,
} from '@/lib/services/deals'

function seguimientoPath(webinarId: number) {
  return `/crm/webinars/${webinarId}/seguimiento`
}

export async function updateCommercialStatus(
  registrationId: number,
  status: CommercialStatus,
  webinarId: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    await prisma.webinarRegistration.update({
      where: { id: registrationId },
      data: { commercialStatus: status },
    })
    revalidatePath(seguimientoPath(webinarId))
  } catch {
    return { error: 'Error al actualizar el estado comercial' }
  }
  return {}
}

export async function createDealForContact(
  contactId: number,
  courseName: string,
  webinarId: number,
): Promise<{ error?: string; dealId?: number }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    const deal = await prisma.deal.create({
      data: { contactId, courseName: courseName.trim() || null, stage: 'LEAD' },
      select: { id: true },
    })
    revalidatePath(seguimientoPath(webinarId))
    return { dealId: deal.id }
  } catch {
    return { error: 'Error al crear la oportunidad' }
  }
}

export async function moveDealStage(
  dealId: number,
  stage: DealStage,
  webinarId: number,
): Promise<{ error?: string }> {
  const r = await moveDealService(dealId, { toStage: stage })
  if (!r.ok) return { error: r.error.message }
  revalidatePath(seguimientoPath(webinarId))
  return {}
}

export async function addNoteToContact(
  contactId: number,
  body: string,
  webinarId: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  if (!body.trim()) return { error: 'La nota no puede estar vacía' }

  try {
    await prisma.contactActivity.create({
      data: { contactId, type: 'NOTE', body: body.trim(), createdById: Number(session.user.id) },
    })
    revalidatePath(seguimientoPath(webinarId))
  } catch {
    return { error: 'Error al guardar la nota' }
  }
  return {}
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/crm/webinars/[id]/seguimiento/actions.ts"
git commit -m "feat: add seguimiento server actions"
```

---

## Task 4: SeguimientoMetrics component

**Files:**
- Create: `app/crm/webinars/[id]/seguimiento/_components/SeguimientoMetrics.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { TOK } from '@/app/crm/_lib/ui-tokens'
import type { SeguimientoMetrics as Metrics } from '../_lib/seguimiento'

function formatMXN(cents: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(cents / 100)
}

const card = 'rounded-[24px] bg-[var(--color-surface-container-low)] p-5 text-center min-w-[100px]'

interface Props { metrics: Metrics }

export function SeguimientoMetrics({ metrics }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-primary)]">{metrics.total}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Registrados</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-secondary)]">{metrics.attended}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Asistentes</div>
      </div>
      <div className={card}>
        <div className={`text-2xl font-bold ${TOK.textSubtle}`}>{metrics.notAttended}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>No asistieron</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-tertiary)]">{metrics.purchased}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Compradores</div>
      </div>
      <div className={card}>
        <div className={`text-2xl font-bold ${TOK.textSubtle}`}>{metrics.conversionPct}%</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Conv. asist→venta</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-primary)]">{formatMXN(metrics.revenueCents)}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Ingresos aprox.</div>
      </div>
      <div className={card}>
        <div className="text-2xl font-bold text-[var(--color-tertiary)]">{metrics.hotLeads}</div>
        <div className={`mt-1 text-xs ${TOK.textSubtle}`}>Leads calientes</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/crm/webinars/[id]/seguimiento/_components/SeguimientoMetrics.tsx"
git commit -m "feat: add SeguimientoMetrics component"
```

---

## Task 5: Modals — CreateDealModal y AddNoteModal

**Files:**
- Create: `app/crm/webinars/[id]/seguimiento/_components/CreateDealModal.tsx`
- Create: `app/crm/webinars/[id]/seguimiento/_components/AddNoteModal.tsx`

- [ ] **Step 1: Create CreateDealModal**

```tsx
'use client'

import { useState, startTransition } from 'react'
import { ModalWrapper } from '@/app/crm/_components/ui/ModalWrapper'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { createDealForContact } from '../actions'

interface Props {
  contactId: number
  contactName: string
  webinarId: number
  onClose: () => void
}

export function CreateDealModal({ contactId, contactName, webinarId, onClose }: Props) {
  const [courseName, setCourseName] = useState('')
  const [loading, setLoading] = useState(false)
  const { error: toastError, success: toastSuccess } = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    startTransition(async () => {
      const result = await createDealForContact(contactId, courseName, webinarId)
      setLoading(false)
      if (result.error) {
        toastError(result.error)
      } else {
        toastSuccess('Oportunidad creada')
        onClose()
      }
    })
  }

  return (
    <ModalWrapper title={`Nueva oportunidad — ${contactName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={TOK.label}>Nombre del curso / producto</label>
          <input
            className={TOK.inputNative}
            placeholder="Ej. Curso de inversión"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            autoFocus
          />
        </div>
        <p className={`text-xs ${TOK.textSubtle}`}>
          Se creará en etapa <strong>Lead</strong>. Puedes moverla desde el pipeline.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={TOK.actionSecondary}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className={TOK.actionPrimary}>
            {loading ? 'Creando…' : 'Crear oportunidad'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}
```

- [ ] **Step 2: Create AddNoteModal**

```tsx
'use client'

import { useState, startTransition } from 'react'
import { ModalWrapper } from '@/app/crm/_components/ui/ModalWrapper'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { addNoteToContact } from '../actions'

interface Props {
  contactId: number
  contactName: string
  webinarId: number
  onClose: () => void
}

export function AddNoteModal({ contactId, contactName, webinarId, onClose }: Props) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const { error: toastError, success: toastSuccess } = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    startTransition(async () => {
      const result = await addNoteToContact(contactId, body, webinarId)
      setLoading(false)
      if (result.error) {
        toastError(result.error)
      } else {
        toastSuccess('Nota registrada')
        onClose()
      }
    })
  }

  return (
    <ModalWrapper title={`Nota — ${contactName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={TOK.label}>Nota</label>
          <textarea
            className={`${TOK.inputNativeMultiline} min-h-[100px]`}
            placeholder="Escribe aquí tu nota…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={TOK.actionSecondary}>
            Cancelar
          </button>
          <button type="submit" disabled={loading || !body.trim()} className={TOK.actionPrimary}>
            {loading ? 'Guardando…' : 'Guardar nota'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/crm/webinars/[id]/seguimiento/_components/CreateDealModal.tsx" \
        "app/crm/webinars/[id]/seguimiento/_components/AddNoteModal.tsx"
git commit -m "feat: add CreateDealModal and AddNoteModal for seguimiento"
```

---

## Task 6: RowActionsMenu

**Files:**
- Create: `app/crm/webinars/[id]/seguimiento/_components/RowActionsMenu.tsx`

- [ ] **Step 1: Create RowActionsMenu**

```tsx
'use client'

import { startTransition } from 'react'
import type { CommercialStatus, DealStage } from '@prisma/client'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import type { RegistrationRow } from '../_lib/seguimiento'
import { moveDealStage } from '../actions'

const STAGE_LABEL: Record<DealStage, string> = {
  LEAD: 'Lead',
  DEMO: 'Demo',
  NEGOTIATION: 'Negociación',
  ENROLLED: 'Cerrado',
}

const STAGES: DealStage[] = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED']

interface Props {
  row: RegistrationRow
  webinarId: number
  onClose: () => void
  onCommercialStatusChange: (registrationId: number, status: CommercialStatus) => void
  onOpenDealModal: (contactId: number, contactName: string) => void
  onOpenNoteModal: (contactId: number, contactName: string) => void
}

const itemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-container-low)] rounded-[var(--radius-sm)]'
const disabledItemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50'
const dividerClass = 'my-1 border-t border-[var(--color-outline-variant)]'

export function RowActionsMenu({
  row,
  webinarId,
  onClose,
  onCommercialStatusChange,
  onOpenDealModal,
  onOpenNoteModal,
}: Props) {
  const { error: toastError } = useToast()
  const contact = row.contact
  const hasDeal = contact.deals.length > 0
  const currentDeal = contact.deals[0]

  function setCommercialStatus(status: CommercialStatus) {
    onCommercialStatusChange(row.id, status) // optimistic update + server action handled by SeguimientoTable
    onClose()
  }

  function handleMoveDeal(stage: DealStage) {
    if (!currentDeal) return
    onClose()
    startTransition(async () => {
      const result = await moveDealStage(currentDeal.id, stage, webinarId)
      if (result.error) toastError(result.error)
    })
  }

  return (
    <div className="flex flex-col p-1">
      {/* Ver contacto */}
      <a
        href={`/crm/contactos/${contact.id}`}
        className={itemClass}
        onClick={onClose}
      >
        <span>👁</span> Ver contacto
      </a>

      {/* Crear oportunidad / pipeline */}
      {!hasDeal ? (
        <button
          type="button"
          className={itemClass}
          onClick={() => { onOpenDealModal(contact.id, contact.name); onClose() }}
        >
          <span>💼</span> Crear oportunidad
        </button>
      ) : (
        <div>
          <div className={`${itemClass} cursor-default opacity-60`}>
            <span>💼</span> Oportunidad: {currentDeal.stage}
          </div>
          <div className="pl-4">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                className={`${itemClass} text-xs`}
                onClick={() => handleMoveDeal(stage)}
                disabled={currentDeal.stage === stage}
              >
                → {STAGE_LABEL[stage]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={dividerClass} />

      {/* Estados comerciales */}
      <button type="button" className={itemClass} onClick={() => setCommercialStatus('CONTACTADO')}>
        <span>✅</span> Marcar como contactado
      </button>
      <button type="button" className={itemClass} onClick={() => setCommercialStatus('INTERESADO')}>
        <span>⭐</span> Marcar como interesado
      </button>
      <button type="button" className={itemClass} onClick={() => setCommercialStatus('NO_RESPONDE')}>
        <span>🔇</span> Marcar como no responde
      </button>

      <div className={dividerClass} />

      {/* Comunicación */}
      {contact.phone ? (
        <a
          href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
          onClick={onClose}
        >
          <span>💬</span> Enviar WhatsApp
        </a>
      ) : (
        <span className={disabledItemClass} title="Sin teléfono registrado">
          <span>💬</span> Enviar WhatsApp
        </span>
      )}
      <a href={`mailto:${contact.email}`} className={itemClass} onClick={onClose}>
        <span>📧</span> Enviar email
      </a>

      <div className={dividerClass} />

      {/* Notas / Tareas */}
      <button type="button" className={itemClass} onClick={() => { onOpenNoteModal(contact.id, contact.name); onClose() }}>
        <span>📝</span> Registrar nota
      </button>
      <span className={disabledItemClass} title="Próximamente — requiere módulo de Tareas">
        <span>📌</span> Crear tarea
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/crm/webinars/[id]/seguimiento/_components/RowActionsMenu.tsx"
git commit -m "feat: add RowActionsMenu for seguimiento"
```

---

## Task 7: SeguimientoTable

**Files:**
- Create: `app/crm/webinars/[id]/seguimiento/_components/SeguimientoTable.tsx`

- [ ] **Step 1: Create SeguimientoTable**

```tsx
'use client'

import { useState, startTransition, useRef, useEffect } from 'react'
import type { CommercialStatus, RegistrationStatus } from '@prisma/client'
import { useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import {
  applyFilter,
  calcLeadScore,
  type FilterKey,
  type RegistrationRow,
  type LeadScore,
} from '../_lib/seguimiento'
import { updateCommercialStatus as updateCommercialStatusAction } from '../actions'
import { RowActionsMenu } from './RowActionsMenu'
import { CreateDealModal } from './CreateDealModal'
import { AddNoteModal } from './AddNoteModal'

// ── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

// ── constants ────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey | 'seguimiento_vencido'; label: string; disabled?: boolean }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'registrados', label: 'Registrados' },
  { key: 'asistieron', label: 'Asistieron' },
  { key: 'no_asistieron', label: 'No asistieron' },
  { key: 'compraron', label: 'Compraron' },
  { key: 'no_compraron', label: 'No compraron' },
  { key: 'contactados', label: 'Contactados' },
  { key: 'sin_contactar', label: 'Sin contactar' },
  { key: 'caliente', label: 'Lead caliente' },
  { key: 'plan_pagos', label: 'Plan de pagos' },
  { key: 'seguimiento_vencido', label: 'Seguimiento vencido', disabled: true },
]

const REGISTRATION_STATUS_OPTIONS: { value: RegistrationStatus; label: string; colorClass: string }[] = [
  { value: 'REGISTERED', label: 'Registrado', colorClass: 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' },
  { value: 'ATTENDED', label: 'Asistió', colorClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' },
  { value: 'PURCHASED', label: 'Compró', colorClass: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]' },
]

const COMMERCIAL_STATUS_OPTIONS: { value: CommercialStatus; label: string; colorClass: string }[] = [
  { value: 'SIN_CONTACTAR', label: 'Sin contactar', colorClass: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]' },
  { value: 'CONTACTADO', label: 'Contactado', colorClass: 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' },
  { value: 'INTERESADO', label: 'Interesado', colorClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' },
  { value: 'PLAN_PAGOS', label: 'Plan de pagos', colorClass: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]' },
  { value: 'NO_RESPONDE', label: 'No responde', colorClass: 'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]' },
  { value: 'DESCARTADO', label: 'Descartado', colorClass: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] opacity-60' },
]

const LEAD_SCORE_CONFIG: Record<LeadScore, { label: string; colorClass: string }> = {
  CALIENTE: { label: 'Caliente 🔥', colorClass: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]' },
  TIBIO: { label: 'Tibio', colorClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]' },
  FRIO: { label: 'Frío', colorClass: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]' },
}

// ── component ────────────────────────────────────────────────────────────────

interface Props {
  registrations: RegistrationRow[]
  webinarId: number
}

export function SeguimientoTable({ registrations, webinarId }: Props) {
  const [filter, setFilter] = useState<FilterKey>('todos')
  const [regStatuses, setRegStatuses] = useState<Record<number, RegistrationStatus>>(
    Object.fromEntries(registrations.map((r) => [r.id, r.status])),
  )
  const [commercialStatuses, setCommercialStatuses] = useState<Record<number, CommercialStatus>>(
    Object.fromEntries(registrations.map((r) => [r.id, r.commercialStatus])),
  )
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [dealModal, setDealModal] = useState<{ contactId: number; contactName: string } | null>(null)
  const [noteModal, setNoteModal] = useState<{ contactId: number; contactName: string } | null>(null)
  const { error: toastError } = useToast()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId !== null) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenuId])

  function handleCommercialStatusChange(registrationId: number, status: CommercialStatus) {
    const prev = commercialStatuses[registrationId]
    setCommercialStatuses((s) => ({ ...s, [registrationId]: status }))
    startTransition(async () => {
      const result = await updateCommercialStatusAction(registrationId, status, webinarId)
      if (result.error) {
        setCommercialStatuses((s) => ({ ...s, [registrationId]: prev }))
        toastError(result.error)
      }
    })
  }

  // Merge optimistic state into rows
  const rows = registrations.map((r) => ({
    ...r,
    status: regStatuses[r.id] ?? r.status,
    commercialStatus: commercialStatuses[r.id] ?? r.commercialStatus,
  }))

  const filtered = applyFilter(rows, filter)

  return (
    <>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          if (f.disabled) {
            return (
              <span
                key={f.key}
                title="Próximamente — requiere módulo de Tareas"
                className="cursor-not-allowed rounded-full px-3 py-1.5 text-xs font-medium opacity-40 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]"
              >
                {f.label}
              </span>
            )
          }
          const isActive = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key as FilterKey)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)]'
                  : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className={`${TOK.emptyState} ${TOK.textSubtle}`}>
          No hay contactos con este filtro.
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className={`grid grid-cols-[1.8fr_1.4fr_1fr_1fr_1fr_1fr_0.8fr_auto] px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] ${TOK.textSubtle}`}>
            <span>Contacto</span>
            <span>Email</span>
            <span>Tel / WhatsApp</span>
            <span>Estado</span>
            <span>Lead score</span>
            <span>Comercial</span>
            <span>Última act.</span>
            <span />
          </div>

          {filtered.map((row) => {
            const score = calcLeadScore(row)
            const scoreConfig = LEAD_SCORE_CONFIG[score]
            const regStatusConfig = REGISTRATION_STATUS_OPTIONS.find((s) => s.value === row.status)
            const commercialConfig = COMMERCIAL_STATUS_OPTIONS.find((s) => s.value === row.commercialStatus)
            const lastActivity = row.contact.activities[0]
            const isMenuOpen = openMenuId === row.id

            return (
              <div key={row.id} className="relative mb-1.5 last:mb-0">
                <div className="grid grid-cols-[1.8fr_1.4fr_1fr_1fr_1fr_1fr_0.8fr_auto] items-center gap-2 rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-3">
                  {/* Contacto */}
                  <a
                    href={`/crm/contactos/${row.contact.id}`}
                    className="truncate text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {row.contact.name}
                  </a>

                  {/* Email */}
                  <span className={`truncate text-sm ${TOK.textSubtle}`}>{row.contact.email}</span>

                  {/* Teléfono */}
                  {row.contact.phone ? (
                    <a
                      href={`https://wa.me/${row.contact.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-[var(--color-primary)] hover:underline"
                    >
                      {row.contact.phone}
                    </a>
                  ) : (
                    <span className={`text-sm ${TOK.textSubtle}`}>—</span>
                  )}

                  {/* Estado registro */}
                  <div>
                    <span className={`inline-block rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium ${regStatusConfig?.colorClass ?? ''}`}>
                      {regStatusConfig?.label ?? row.status}
                    </span>
                  </div>

                  {/* Lead score */}
                  <div>
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${scoreConfig.colorClass}`}>
                      {scoreConfig.label}
                    </span>
                  </div>

                  {/* Estado comercial — inline select */}
                  <div>
                    <select
                      value={row.commercialStatus}
                      onChange={(e) => handleCommercialStatusChange(row.id, e.target.value as CommercialStatus)}
                      aria-label={`Estado comercial de ${row.contact.name}`}
                      className={`rounded-[var(--radius-sm)] border-0 py-1 pl-2 pr-6 text-xs font-medium outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] ${commercialConfig?.colorClass ?? ''}`}
                    >
                      {COMMERCIAL_STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Última actividad */}
                  <span className={`text-xs ${TOK.textSubtle}`}>
                    {lastActivity ? relativeTime(lastActivity.createdAt) : '—'}
                  </span>

                  {/* Acciones */}
                  <div className="relative flex justify-end" ref={isMenuOpen ? menuRef : undefined}>
                    <button
                      type="button"
                      aria-label={`Acciones para ${row.contact.name}`}
                      onClick={() => setOpenMenuId(isMenuOpen ? null : row.id)}
                      className="rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-low)]"
                    >
                      ···
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-md)]">
                        <RowActionsMenu
                          row={row}
                          webinarId={webinarId}
                          onClose={() => setOpenMenuId(null)}
                          onCommercialStatusChange={handleCommercialStatusChange}
                          onOpenDealModal={(contactId, contactName) => setDealModal({ contactId, contactName })}
                          onOpenNoteModal={(contactId, contactName) => setNoteModal({ contactId, contactName })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {dealModal && (
        <CreateDealModal
          contactId={dealModal.contactId}
          contactName={dealModal.contactName}
          webinarId={webinarId}
          onClose={() => setDealModal(null)}
        />
      )}
      {noteModal && (
        <AddNoteModal
          contactId={noteModal.contactId}
          contactName={noteModal.contactName}
          webinarId={webinarId}
          onClose={() => setNoteModal(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/crm/webinars/[id]/seguimiento/_components/SeguimientoTable.tsx"
git commit -m "feat: add SeguimientoTable client component"
```

---

## Task 8: Page (server component)

**Files:**
- Create: `app/crm/webinars/[id]/seguimiento/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { calcMetrics } from './_lib/seguimiento'
import { SeguimientoMetrics } from './_components/SeguimientoMetrics'
import { SeguimientoTable } from './_components/SeguimientoTable'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SeguimientoPage({ params }: Props) {
  const { id } = await params
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    select: {
      id: true,
      title: true,
      registrations: {
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              activities: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { id: true, createdAt: true, type: true },
              },
              deals: {
                where: { deletedAt: null },
                include: {
                  sales: {
                    where: { status: 'PAID' },
                    select: { amountCents: true },
                  },
                },
                orderBy: { updatedAt: 'desc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!webinar) notFound()

  const metrics = calcMetrics(webinar.registrations)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/crm/webinars/${webinarId}`}
        className={`inline-flex items-center gap-1 ${TOK.textMuted} transition-colors hover:text-[var(--color-on-surface)]`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        {webinar.title}
      </Link>

      <div>
        <h2 className={TOK.sectionTitle}>Seguimiento comercial</h2>
        <p className={`mt-1 ${TOK.sectionSubtitle}`}>{metrics.total} contactos · Actualizado en tiempo real</p>
      </div>

      <SeguimientoMetrics metrics={metrics} />

      <div className={`${TOK.panel} p-6`}>
        <SeguimientoTable registrations={webinar.registrations} webinarId={webinarId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/crm/webinars/[id]/seguimiento/page.tsx"
git commit -m "feat: add seguimiento page server component"
```

---

## Task 9: Add "Seguimiento" tab to existing webinar page

**Files:**
- Modify: `app/crm/webinars/[id]/page.tsx`

- [ ] **Step 1: Add the Seguimiento link**

En `app/crm/webinars/[id]/page.tsx`, el tab bar actual usa un `inline-flex` con tres `Link` (`info`, `participantes`, `zoom`). Agrega un cuarto ítem después del tab "Zoom".

Localiza el bloque del tab bar (líneas ~66-83) y añade este Link dentro del mismo `div`:

```tsx
<Link
  href={`/crm/webinars/${webinarId}/seguimiento`}
  className={`rounded-[calc(var(--radius-md)-4px)] px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]`}
>
  Seguimiento
</Link>
```

> Nota: Este link no usa `activeTab` porque es una ruta separada, no un `?tab=` param. No necesita estado activo en la página del webinar.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/crm/webinars/[id]/page.tsx"
git commit -m "feat: add Seguimiento link to webinar detail tab bar"
```

---

## Task 10: Smoke test manual

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verificar flujo completo**

1. Ir a `/crm/webinars` → abrir un webinar con registros
2. Hacer click en tab "Seguimiento" → debe cargar `/crm/webinars/[id]/seguimiento`
3. Verificar que las 7 métricas aparecen correctamente
4. Probar chips de filtro (Todos / Asistieron / Lead caliente) — la tabla debe filtrar sin recargar
5. Cambiar "Estado comercial" con el select inline → debe actualizarse optimísticamente
6. Abrir menú "···" de una fila → verificar todas las acciones listadas
7. Hacer "Registrar nota" → debe abrir modal, guardar y cerrar
8. Hacer "Crear oportunidad" → debe abrir modal, crear deal y cerrarse
9. Verificar que "Crear tarea" aparece deshabilitado con tooltip
10. Verificar que "Enviar WhatsApp" está oculto/disabled para contactos sin teléfono

- [ ] **Step 3: Commit final si todo está bien**

```bash
git add -p  # Revisar cualquier cambio residual
git commit -m "feat: webinar seguimiento view complete"
```
