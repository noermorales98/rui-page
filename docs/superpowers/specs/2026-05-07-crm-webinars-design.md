# CRM Webinars Design

## Overview

A webinar management section for tracking events and their participants. Each webinar has a list of contacts with a status that progresses from Registered → Attended → Purchased. Designed for a course creator who runs webinars to generate leads.

---

## Data Model

### New Prisma models: `Webinar` and `WebinarRegistration`

```prisma
enum RegistrationStatus {
  REGISTERED
  ATTENDED
  PURCHASED
}

model Webinar {
  id            Int                   @id @default(autoincrement())
  title         String
  date          DateTime
  platform      String?               // free text: "Zoom", "Meet", etc.
  link          String?
  description   String?               @db.Text
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt
  registrations WebinarRegistration[]
}

model WebinarRegistration {
  id         Int                @id @default(autoincrement())
  webinar    Webinar            @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  webinarId  Int
  contact    Contact            @relation(fields: [contactId], references: [id], onDelete: Cascade)
  contactId  Int
  status     RegistrationStatus @default(REGISTERED)
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt

  @@unique([webinarId, contactId])
}
```

The `Contact` model gains a `registrations WebinarRegistration[]` relation field.

- `platform` is free text — no enum, so any platform name works.
- `@@unique([webinarId, contactId])` prevents duplicate registrations.
- `onDelete: Cascade` on both sides — deleting a webinar removes all registrations; deleting a contact removes their registrations.

---

## Routes & Files

```
app/crm/webinars/
  page.tsx                          ← server component: list all webinars
  actions.ts                        ← all server actions
  _components/
    WebinarTable.tsx                ← 'use client' — table rows, delete confirm
    CreateWebinarModal.tsx          ← 'use client' — create / edit webinar form
  [id]/
    page.tsx                        ← server component: webinar detail
    _components/
      WebinarHeader.tsx             ← title, date, platform, link, edit/delete buttons
      WebinarStats.tsx              ← 4 stat boxes: registered, attended, purchased, % attendance
      ParticipantsTable.tsx         ← 'use client' — table with inline status selector + remove
      AddParticipantButton.tsx      ← 'use client' — opens modal to search and add a contact
      ImportCsvButton.tsx           ← 'use client' — parses CSV, calls importRegistrations
```

---

## Page: `/crm/webinars/page.tsx`

Server component. Fetches all webinars ordered by `date DESC`, with aggregate counts per status via `_count`. Passes data to `<WebinarTable>`.

```ts
type WebinarRow = {
  id: number
  title: string
  date: Date
  platform: string | null
  registrations: { status: RegistrationStatus }[]
}
```

Stats are computed client-side from the `registrations` array: filter by status to get counts.

---

## Page: `/crm/webinars/[id]/page.tsx`

Server component. Fetches the webinar with all registrations including contact info:

```ts
type WebinarDetail = Webinar & {
  registrations: (WebinarRegistration & {
    contact: Pick<Contact, 'id' | 'name' | 'email'>
  })[]
}
```

Renders `<WebinarHeader>`, `<WebinarStats>`, `<AddParticipantButton>`, `<ImportCsvButton>`, and `<ParticipantsTable>`.

---

## Component: `WebinarTable.tsx`

`'use client'`. Receives webinar rows. Each row is clickable (navigates to `/crm/webinars/[id]`). Columns: Webinar title + platform subtitle, Date, Registrados, Asistieron, Compraron, actions (edit, delete).

- Edit opens `<CreateWebinarModal>` with the webinar pre-filled.
- Delete shows inline confirmation before calling `deleteWebinar`.

---

## Component: `CreateWebinarModal.tsx`

`'use client'`. Handles create and edit modes via `useActionState`.

Fields:
- **Título** (required) — text input
- **Fecha** (required) — `datetime-local` input
- **Plataforma** (optional) — text input, placeholder "ej. Zoom"
- **Link** (optional) — text input, placeholder "https://..."
- **Descripción** (optional) — textarea

Uses `createWebinar` or `updateWebinar(id)` depending on mode. Closes on success (same `isPending + submittedRef` pattern as `CreateDealModal`).

---

## Component: `ParticipantsTable.tsx`

`'use client'`. Receives registrations array. Each row:
- Contact name (links to `/crm/contactos/[id]`)
- Email
- Status selector (`<select>`) — calls `updateRegistrationStatus` on change, optimistic update
- Date added
- Remove button — calls `removeRegistration` with inline confirm

---

## Component: `AddParticipantButton.tsx`

`'use client'`. Button that opens a small modal:
- Search input using `/api/crm/contacts-search` (existing endpoint)
- On select: calls `addRegistration(webinarId, contactId)`
- If the user types an email not found, shows option "Crear nuevo contacto" — calls `createAndRegister(webinarId, name, email)`

---

## Component: `ImportCsvButton.tsx`

`'use client'`. File input (hidden) + styled button. On file select:
1. Reads CSV client-side — expects columns `nombre` and `email` (case-insensitive, first row = header).
2. Shows preview: "N contactos encontrados en el archivo".
3. On confirm: calls `importRegistrations(webinarId, rows)`.

---

## Server Actions: `actions.ts`

All auth-gated. Zod-validated where user input is involved.

### `createWebinar(prevState, formData): Promise<State>`
Creates webinar. Required: `title`, `date`. Optional: `platform`, `link`, `description`. Revalidates `/crm/webinars`.

### `updateWebinar(id, prevState, formData): Promise<State>`
Updates all fields. Revalidates `/crm/webinars` and `/crm/webinars/[id]`.

### `deleteWebinar(id): Promise<void>`
Deletes webinar (cascade removes all registrations). Revalidates `/crm/webinars`.

### `addRegistration(webinarId, contactId): Promise<void>`
Creates registration with status `REGISTERED`. Uses `create` — throws if duplicate (caller should prevent). Revalidates `/crm/webinars/[id]`.

### `createAndRegister(webinarId, name, email): Promise<{ error?: string }>`
Upserts contact by email (`source: WEBINAR` on create). Then upserts registration. Revalidates `/crm/webinars/[id]` and `/crm/contactos`.

### `updateRegistrationStatus(registrationId, status): Promise<void>`
Updates status field. Revalidates `/crm/webinars/[id]`.

### `removeRegistration(registrationId): Promise<void>`
Deletes registration. Revalidates `/crm/webinars/[id]`.

### `importRegistrations(webinarId, rows: { name: string; email: string }[]): Promise<{ imported: number; skipped: number }>`
For each row: upserts contact by email, upserts registration. Returns counts for feedback. Revalidates `/crm/webinars/[id]` and `/crm/contactos`.

---

## Status Display

| Status key   | Label      | Badge color |
|---|---|---|
| REGISTERED   | Registrado | Indigo      |
| ATTENDED     | Asistió    | Yellow      |
| PURCHASED    | Compró     | Green       |

---

## Error Handling

- `createWebinar` / `updateWebinar`: Zod errors returned as `{ error: string }` via `useActionState`.
- `updateRegistrationStatus`: optimistic update, silent failure (no toast for MVP).
- `importRegistrations`: returns `{ imported, skipped }` — show summary message after completion.
- Duplicate registration in `addRegistration`: prevented by disabling the add button if the contact is already in the list.
- `deleteWebinar`: requires user confirmation before calling the action.

---

## Out of Scope (MVP)

- Email notifications to registrants
- Webinar recording / replay link
- Direct Zoom / Meet API integration
- Pagination of participants (assumes < 500 per webinar)
- Status change history / audit log
- Filtering participants by status
