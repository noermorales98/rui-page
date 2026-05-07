# CRM Pipeline Design

## Overview

A Kanban-style sales pipeline for tracking contacts interested in buying courses. Deals move through four stages: Lead → Demo/Llamada → Negociación → Inscrito.

**Context:** This is a small CRM for a course creator / coach. The pipeline is the primary tool to see where each potential student is in the buying process.

---

## Data Model

### New Prisma model: `Deal`

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

- `courseName` is free text (no Course model exists yet). Nullable — a deal can exist without specifying a course.
- `onDelete: Cascade` — deleting a contact removes all their deals.
- A contact can have multiple deals (e.g., interested in two different courses).
- The `Contact` model gains a `deals Deal[]` relation field.

---

## Routes & Files

### New route: `/crm/pipeline`

```
app/crm/pipeline/
  page.tsx                        ← server component
  actions.ts                      ← server actions
  _components/
    PipelineBoard.tsx              ← 'use client' — DndContext, optimistic state
    PipelineColumn.tsx             ← useDroppable per stage column
    DealCard.tsx                   ← useDraggable per deal card
    CreateDealModal.tsx            ← create/edit deal modal
```

### Modified: `/crm/contactos/[id]`

```
app/crm/contactos/[id]/
  _components/
    ContactDeals.tsx               ← new: shows deals list + "Nueva oportunidad" button
```

---

## Page: `/crm/pipeline/page.tsx`

Server component. Fetches all deals (not soft-deleted) with their contact data, grouped by stage. Passes grouped data to `<PipelineBoard>`.

```ts
type DealWithContact = Deal & {
  contact: Pick<Contact, 'id' | 'name' | 'email'>
}

type GroupedDeals = Record<DealStage, DealWithContact[]>
```

Each stage is ordered by `updatedAt DESC`.

---

## Component: `PipelineBoard.tsx`

`'use client'`. Receives `initialDeals: GroupedDeals`.

- Holds `deals` state as local copy for optimistic updates.
- Wraps everything in `DndContext` from `@dnd-kit/core`.
- `onDragEnd` handler:
  1. Reads `active.id` (dealId) and `over.id` (target stage).
  2. Updates local state immediately.
  3. Calls `moveDeal(dealId, newStage)` in a `startTransition`.
  4. On error, reverts state.
- Renders one `<PipelineColumn>` per stage.

---

## Component: `PipelineColumn.tsx`

`'use client'`. Uses `useDroppable({ id: stage })`.

- Renders stage header: name + deal count badge.
- Renders a `<DealCard>` for each deal in the column.
- "+" button at the bottom opens `CreateDealModal` with stage pre-selected.

---

## Component: `DealCard.tsx`

`'use client'`. Uses `useDraggable({ id: deal.id })`.

Displays:
- Contact name (links to `/crm/contactos/[id]`)
- Course name, or "sin curso" in muted style if null
- Time since `updatedAt`

Actions (via icon menu or inline):
- **Stage selector** (dropdown) — fallback for accessibility/mobile, calls `moveDeal`
- **Edit** — opens `CreateDealModal` in edit mode
- **Delete** — confirmation then calls `deleteDeal`

---

## Component: `CreateDealModal.tsx`

`'use client'`. Handles both create and edit modes.

Fields:
- **Contacto** (required) — searchable select. Client-side search: fetch `/api/crm/contacts-search?q=` which returns `[{id, name, email}]`. Shows selected contact name; clicking opens the dropdown.
- **Curso** (optional) — text input, placeholder "ej. Presencia Escénica"
- **Etapa** — select, defaults to LEAD (or pre-selected stage when opened from a column)
- **Notas** — textarea, optional

Uses `useActionState` with `createDeal` or `updateDeal`.

---

## Server Actions: `actions.ts`

All validated with Zod.

### `createDeal(prevState, formData): Promise<State>`

Creates a deal. Required: `contactId`. Optional: `courseName`, `stage` (default LEAD), `notes`.
Revalidates `/crm/pipeline` and `/crm/contactos/[contactId]`.

### `updateDeal(dealId, prevState, formData): Promise<State>`

Updates `courseName`, `stage`, `notes`. Revalidates same paths.

### `deleteDeal(dealId): Promise<void>`

Deletes deal by id. Revalidates same paths.

### `moveDeal(dealId, stage): Promise<void>`

Updates only the `stage` field. Called optimistically — no prevState needed (not a form action). Revalidates `/crm/pipeline`.

---

## API Route: `/api/crm/contacts-search`

`GET /api/crm/contacts-search?q=<query>`

Returns up to 10 contacts matching the query (name or email LIKE). Used by `CreateDealModal` for the contact search input.

Response: `[{ id: number, name: string, email: string }]`

---

## Contact Detail Integration

New component `ContactDeals.tsx` (server component) added to the contact detail page.

- Fetches deals for the contact.
- Shows each deal as a row: course name (or "sin curso") + stage badge + edit/delete buttons.
- "Nueva oportunidad" button opens `CreateDealModal` (contact pre-filled, not changeable).

The `CreateDealModal` is rendered on the client inside the detail page layout.

---

## Dependencies

- `@dnd-kit/core` — drag-and-drop primitives
- `@dnd-kit/utilities` — CSS transforms helper

No sortable needed (cards don't sort within a column, only move between columns).

---

## Stages Display

| Stage key | Label display | Badge color |
|---|---|---|
| LEAD | Lead | Indigo |
| DEMO | Demo / Llamada | Yellow |
| NEGOTIATION | Negociación | Orange |
| ENROLLED | Inscrito | Green |

---

## Error Handling

- `createDeal` / `updateDeal`: Zod validation errors returned as `{ error: string }` via `useActionState`.
- `moveDeal`: Silent failure with state revert on the client. No toast needed for MVP.
- `deleteDeal`: Called from a form, any error surfaced via `useActionState`.

---

## Out of Scope (MVP)

- Sorting cards within a column
- Deal value / monetary amounts
- Due dates or reminders
- Activity feed on deals (only on contacts for now)
- Filtering pipeline by course name
