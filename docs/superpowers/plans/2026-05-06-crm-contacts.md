# CRM Contacts Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full CRM Contacts module at `/crm/contactos` — list with filters + pagination, detail page with activity feed, CSV import, and create/edit/delete operations.

**Architecture:** Server components fetch and render data; client components handle interactivity (filters, forms, file upload). Server actions in `actions.ts` files handle all mutations. URL search params drive filtering and pagination — no client-side state for those.

> **Actualización (mayo 2026):** Alta/edición/import CSV de contactos vive en rutas de página (`nuevo`, `[id]/editar`, `importar`) con `ContactForm` y `CsvImporter`. Las tareas que citan `CreateContactModal` / `ImportCsvModal` son históricas.

**Tech Stack:** Next.js 16 App Router, Prisma 7 + MariaDB, React 19 `useActionState`, Tailwind CSS v4, Zod, `@/auth` for sessions.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add Contact, Tag, ContactTag, ContactActivity models + enums; add `activities` relation to User |
| `app/crm/contactos/page.tsx` | Modify | Replace placeholder: server component that reads search params, queries DB, renders list |
| `app/crm/contactos/actions.ts` | Create | `createContact`, `updateContact`, `deleteContact`, `importContacts`, `upsertTag` |
| `app/crm/contactos/_components/ContactsTable.tsx` | Create | Client component — renders contact rows with status badges and tag chips |
| `app/crm/contactos/_components/ContactFilters.tsx` | Create | Client component — search + status/source/tag selects, updates URL params |
| `app/crm/contactos/nuevo/page.tsx` | Create | Ruta + `ContactForm` para alta |
| `app/crm/contactos/[id]/editar/page.tsx` | Create | Ruta + `ContactForm` para edición |
| `app/crm/contactos/importar/page.tsx` | Create | Ruta + `CsvImporter` → import servidor |
| `app/crm/contactos/_components/ContactForm.tsx` | Create | Client — create/edit contact, `useActionState` |
| `app/crm/contactos/_components/CsvImporter.tsx` | Create | Client — upload archivo, llama acción servidor |
| `app/crm/contactos/[id]/page.tsx` | Create | Server component — fetches contact + activities, two-column layout |
| `app/crm/contactos/[id]/actions.ts` | Create | `addNote`; re-exports `updateContact`/`deleteContact` from parent |
| `app/crm/contactos/[id]/_components/ContactHeader.tsx` | Create | Server component — avatar initials, name, status badge, tags |
| `app/crm/contactos/[id]/_components/EditDeleteButtons.tsx` | Create | Client — `Link` a `/crm/contactos/[id]/editar` + eliminar con `deleteContact` |
| `app/crm/contactos/[id]/_components/ContactInfo.tsx` | Create | Server component — email, phone, source, date fields |
| `app/crm/contactos/[id]/_components/ActivityFeed.tsx` | Create | Server component — chronological activity list with icons |
| `app/crm/contactos/[id]/_components/AddNoteForm.tsx` | Create | Client component — textarea + submit, uses `useActionState` with `addNote` |

---

## Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema**

Replace the entire `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  // url is configured in prisma.config.ts (Prisma 7 — no url field in schema)
}

model User {
  id         Int               @id @default(autoincrement())
  name       String
  email      String            @unique
  password   String
  role       Role              @default(EDITOR)
  active     Boolean           @default(true)
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  activities ContactActivity[]
}

model Contact {
  id         Int               @id @default(autoincrement())
  name       String
  email      String            @unique
  phone      String?
  source     ContactSource     @default(MANUAL)
  status     ContactStatus     @default(NEW)
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  tags       ContactTag[]
  activities ContactActivity[]
}

model Tag {
  id       Int          @id @default(autoincrement())
  name     String       @unique
  color    String       @default("#6366f1")
  contacts ContactTag[]
}

model ContactTag {
  contactId Int
  tagId     Int
  contact   Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([contactId, tagId])
}

model ContactActivity {
  id          Int          @id @default(autoincrement())
  contactId   Int
  type        ActivityType @default(NOTE)
  body        String?      @db.Text
  createdAt   DateTime     @default(now())
  createdById Int?
  contact     Contact      @relation(fields: [contactId], references: [id], onDelete: Cascade)
  createdBy   User?        @relation(fields: [createdById], references: [id], onDelete: SetNull)
}

enum Role {
  ADMIN
  EDITOR
}

enum ContactSource {
  WEBINAR
  FORM
  MANUAL
  IMPORT
}

enum ContactStatus {
  NEW
  QUALIFIED
  CLIENT
}

enum ActivityType {
  NOTE
  EMAIL_SENT
  WEBINAR_REGISTERED
  WEBINAR_ATTENDED
  COURSE_PURCHASED
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-contacts-module
```

Expected: "Your database is now in sync with your schema." No errors.

- [ ] **Step 3: Verify types generated**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If there are errors, they should only reference the new models not yet imported — that's fine at this stage.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(contacts): add Contact, Tag, ContactActivity schema models"
```

---

## Task 2: Server Actions

**Files:**
- Create: `app/crm/contactos/actions.ts`

- [ ] **Step 1: Create actions file**

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().optional(),
  source: z.enum(['WEBINAR', 'FORM', 'MANUAL', 'IMPORT']),
  status: z.enum(['NEW', 'QUALIFIED', 'CLIENT']),
})

type ContactState = { error: string } | null

export async function createContact(
  prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    source: formData.get('source') as string,
    status: formData.get('status') as string,
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const tagIds = (formData.getAll('tagIds') as string[]).map(Number).filter(Boolean)
  const newTagNames = (formData.getAll('newTagNames') as string[]).filter(Boolean)

  // Upsert new tags and collect all tag IDs
  const upsertedTags = await Promise.all(
    newTagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )
  const allTagIds = [...tagIds, ...upsertedTags.map((t) => t.id)]

  try {
    await prisma.contact.create({
      data: {
        ...parsed.data,
        tags: {
          create: allTagIds.map((tagId) => ({ tagId })),
        },
      },
    })
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return { error: 'Este email ya está registrado' }
    }
    return { error: 'Error al crear el contacto' }
  }

  revalidatePath('/crm/contactos')
  return null
}

export async function updateContact(
  id: number,
  prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    source: formData.get('source') as string,
    status: formData.get('status') as string,
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const tagIds = (formData.getAll('tagIds') as string[]).map(Number).filter(Boolean)
  const newTagNames = (formData.getAll('newTagNames') as string[]).filter(Boolean)

  const upsertedTags = await Promise.all(
    newTagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )
  const allTagIds = [...tagIds, ...upsertedTags.map((t) => t.id)]

  try {
    await prisma.$transaction([
      prisma.contactTag.deleteMany({ where: { contactId: id } }),
      prisma.contact.update({
        where: { id },
        data: {
          ...parsed.data,
          tags: {
            create: allTagIds.map((tagId) => ({ tagId })),
          },
        },
      }),
    ])
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return { error: 'Este email ya está registrado' }
    }
    return { error: 'Error al actualizar el contacto' }
  }

  revalidatePath('/crm/contactos')
  revalidatePath(`/crm/contactos/${id}`)
  return null
}

export async function deleteContact(id: number, _formData?: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  await prisma.contact.delete({ where: { id } })
  revalidatePath('/crm/contactos')
  redirect('/crm/contactos')
}

const importRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.enum(['WEBINAR', 'FORM', 'MANUAL', 'IMPORT']).optional(),
})

type ImportResult = { imported: number; skipped: number; errors: string[] }

export async function importContacts(
  prevState: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user) return { imported: 0, skipped: 0, errors: ['No autorizado'] }

  const rawRows = formData.get('rows') as string
  let rows: unknown[]
  try {
    rows = JSON.parse(rawRows)
  } catch {
    return { imported: 0, skipped: 0, errors: ['JSON inválido'] }
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const parsed = importRowSchema.safeParse(row)
    if (!parsed.success) {
      skipped++
      continue
    }
    const { name, email, phone, source } = parsed.data
    try {
      await prisma.contact.upsert({
        where: { email },
        update: { phone: phone ?? undefined, source: source ?? undefined },
        create: { name, email, phone, source: source ?? 'IMPORT' },
      })
      imported++
    } catch (err: unknown) {
      errors.push(email)
      skipped++
    }
  }

  revalidatePath('/crm/contactos')
  return { imported, skipped, errors }
}

export async function upsertTag(name: string, color?: string) {
  const session = await auth()
  if (!session?.user) return null

  return prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name, color: color ?? '#6366f1' },
  })
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "contactos/actions"
```

Expected: no output (no errors in that file).

- [ ] **Step 3: Commit**

```bash
git add app/crm/contactos/actions.ts
git commit -m "feat(contacts): add server actions for contact CRUD and CSV import"
```

---

## Task 3: Contact List Page

**Files:**
- Modify: `app/crm/contactos/page.tsx`

- [ ] **Step 1: Replace placeholder page**

```tsx
// Patrón actual (mayo 2026): sin modales en listado — enlaces a rutas dedicadas.
import Link from 'next/link'
// ... datos: listContacts / prisma según implementación en repo ...

// Header acciones:
// <Link href="/crm/contactos/importar">Importar CSV</Link>
// <Link href="/crm/contactos/nuevo">Nuevo contacto</Link>
// <ContactFilters tags={allTags} />
// <ContactsTable contacts={contacts} />

// Implementación de referencia: `app/crm/contactos/page.tsx`
```


- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "contactos/page"
```

Expected: puede avisar componentes aún no creados (`ContactsTable`, `ContactFilters`, etc.); cero otros errores. (Los modales de contacto ya no aplican — ver Task 5 y 6 archivados.)

- [ ] **Step 3: Commit**

```bash
git add app/crm/contactos/page.tsx
git commit -m "feat(contacts): add contact list server page with filters and pagination"
```

---

## Task 4: ContactsTable and ContactFilters

**Files:**
- Create: `app/crm/contactos/_components/ContactsTable.tsx`
- Create: `app/crm/contactos/_components/ContactFilters.tsx`

- [ ] **Step 1: Create ContactsTable**

```typescript
'use client'

import Link from 'next/link'
import type { Contact, ContactTag, Tag } from '@prisma/client'

type ContactWithTags = Contact & {
  tags: (ContactTag & { tag: Tag })[]
}

interface Props {
  contacts: ContactWithTags[]
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  QUALIFIED: 'Calificado',
  CLIENT: 'Cliente',
}

const STATUS_CLASSES: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  QUALIFIED: 'bg-yellow-50 text-yellow-800',
  CLIENT: 'bg-green-50 text-green-700',
}

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar',
  FORM: 'Formulario',
  MANUAL: 'Manual',
  IMPORT: 'Importado',
}

export function ContactsTable({ contacts }: Props) {
  if (contacts.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-500">
        No hay contactos que coincidan con los filtros.
      </div>
    )
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {['Nombre', 'Email', 'Teléfono', 'Estado', 'Tags', 'Fuente', 'Fecha'].map((h) => (
            <th
              key={h}
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {contacts.map((contact) => (
          <tr key={contact.id} className="hover:bg-gray-50">
            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
              <Link
                href={`/crm/contactos/${contact.id}`}
                className="hover:text-indigo-600 hover:underline"
              >
                {contact.name}
              </Link>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
              {contact.email}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {contact.phone ?? '—'}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[contact.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {STATUS_LABELS[contact.status] ?? contact.status}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex flex-wrap gap-1">
                {contact.tags.length === 0 ? (
                  <span className="text-xs text-gray-400">—</span>
                ) : (
                  contact.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))
                )}
              </div>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
              {SOURCE_LABELS[contact.source] ?? contact.source}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-400">
              {new Intl.DateTimeFormat('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(new Date(contact.createdAt))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 2: Create ContactFilters**

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useEffect } from 'react'
import type { Tag } from '@prisma/client'

interface Props {
  tags: Tag[]
}

export function ContactFilters({ tags }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParam('q', value), 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => handleSearch(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => updateParam('status', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Estado: Todos</option>
        <option value="NEW">Nuevo</option>
        <option value="QUALIFIED">Calificado</option>
        <option value="CLIENT">Cliente</option>
      </select>

      <select
        value={searchParams.get('source') ?? ''}
        onChange={(e) => updateParam('source', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Fuente: Todas</option>
        <option value="WEBINAR">Webinar</option>
        <option value="FORM">Formulario</option>
        <option value="MANUAL">Manual</option>
        <option value="IMPORT">Importado</option>
      </select>

      {tags.length > 0 && (
        <select
          value={searchParams.get('tag') ?? ''}
          onChange={(e) => updateParam('tag', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tag: Todos</option>
          {tags.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "ContactsTable|ContactFilters"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/crm/contactos/_components/ContactsTable.tsx app/crm/contactos/_components/ContactFilters.tsx
git commit -m "feat(contacts): add ContactsTable and ContactFilters client components"
```

---

---

## Task 5 y 6 (histórico): modales Create / Import CSV

Los pasos detallados y los snippets completos del plan original viven en:

- [`docs/superpowers/archive/2026-05-06-crm-contacts-modales-apendices-historico.md`](../archive/2026-05-06-crm-contacts-modales-apendices-historico.md) (incluye apéndices: listado con modales, `EditDeleteButtons` con modal)

**Implementación actual (sin modales de contacto):**

| Objetivo | Ruta / componente |
|----------|-------------------|
| Alta | `app/crm/contactos/nuevo/page.tsx` + `ContactForm.tsx` |
| Edicion | `app/crm/contactos/[id]/editar/page.tsx` + `ContactForm.tsx` |
| Import CSV | `app/crm/contactos/importar/page.tsx` + `CsvImporter.tsx` |

---

---

## Task 7: Contact Detail Page

**Files:**
- Create: `app/crm/contactos/[id]/page.tsx`
- Create: `app/crm/contactos/[id]/_components/ContactInfo.tsx`
- Create: `app/crm/contactos/[id]/_components/ContactHeader.tsx`
- Create: `app/crm/contactos/[id]/_components/ActivityFeed.tsx`

- [ ] **Step 1: Create the detail page**

```typescript
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ContactHeader } from './_components/ContactHeader'
import { ContactInfo } from './_components/ContactInfo'
import { ActivityFeed } from './_components/ActivityFeed'
import { AddNoteForm } from './_components/AddNoteForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params
  const contactId = Number(id)

  if (isNaN(contactId)) notFound()

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      tags: { include: { tag: true } },
      activities: {
        include: { createdBy: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!contact) notFound()

  return (
    <div>
      {/* Back link */}
      <a
        href="/crm/contactos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Contactos
      </a>

      <div className="flex gap-6">
        {/* Left column: contact info */}
        <div className="w-72 flex-shrink-0">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <ContactInfo contact={contact} />
          </div>
        </div>

        {/* Right column: header + activity */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <ContactHeader contact={contact} />
            <div className="p-6">
              <AddNoteForm contactId={contact.id} />
              <ActivityFeed activities={contact.activities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ContactInfo**

```typescript
import type { Contact, ContactTag, Tag } from '@prisma/client'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar',
  FORM: 'Formulario',
  MANUAL: 'Manual',
  IMPORT: 'Importado',
}

export function ContactInfo({ contact }: { contact: ContactWithTags }) {
  const fields = [
    { label: 'Email', value: contact.email },
    { label: 'Teléfono', value: contact.phone ?? '—' },
    { label: 'Fuente', value: SOURCE_LABELS[contact.source] ?? contact.source },
    {
      label: 'Registrado',
      value: new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(contact.createdAt)),
    },
  ]

  return (
    <div className="p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Información
      </p>
      <dl className="space-y-4">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="mb-0.5 text-xs text-gray-400">{label}</dt>
            <dd className="text-sm text-gray-900 break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
```

- [ ] **Step 3: Create ContactHeader**

```typescript
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { EditDeleteButtons } from './EditDeleteButtons'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  QUALIFIED: 'Calificado',
  CLIENT: 'Cliente',
}

const STATUS_CLASSES: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  QUALIFIED: 'bg-yellow-50 text-yellow-800',
  CLIENT: 'bg-green-50 text-green-700',
}

function initials(name: string): string {
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + (parts.length > 1 ? last : '')).toUpperCase()
}

export function ContactHeader({
  contact,
}: {
  contact: ContactWithTags
}) {
  return (
    <div className="flex items-start gap-4 border-b border-gray-100 p-6">
      {/* Avatar */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
        {initials(contact.name)}
      </div>

      {/* Name + badges */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-gray-900">{contact.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[contact.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {STATUS_LABELS[contact.status] ?? contact.status}
          </span>
          {contact.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <EditDeleteButtons contact={contact} />
    </div>
  )
}
```

- [ ] **Step 4: Create ActivityFeed**

```typescript
import type { ContactActivity, User } from '@prisma/client'

type ActivityWithUser = ContactActivity & { createdBy: User | null }

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: '📝',
  EMAIL_SENT: '✉️',
  WEBINAR_REGISTERED: '📅',
  WEBINAR_ATTENDED: '📅',
  COURSE_PURCHASED: '🎓',
}

const ACTIVITY_LABELS: Record<string, string> = {
  NOTE: '',
  EMAIL_SENT: 'Se envió email',
  WEBINAR_REGISTERED: 'Registrado al webinar',
  WEBINAR_ATTENDED: 'Asistió al webinar',
  COURSE_PURCHASED: 'Compró curso',
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

export function ActivityFeed({ activities }: { activities: ActivityWithUser[] }) {
  if (activities.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-400">Sin actividad registrada.</p>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Historial de actividad
      </p>
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm">
            {ACTIVITY_ICONS[activity.type] ?? '•'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">
              {activity.type === 'NOTE'
                ? activity.body
                : `${ACTIVITY_LABELS[activity.type]}${activity.body ? ` — ${activity.body}` : ''}`}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {relativeTime(new Date(activity.createdAt))}
              {' · '}
              {activity.createdBy?.name ?? 'automático'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "contactos/\[id\]"
```

Expected: Errors for missing `EditDeleteButtons` and `AddNoteForm` — those are fine, created in next task.

- [ ] **Step 6: Commit**

```bash
git add app/crm/contactos/\[id\]/page.tsx app/crm/contactos/\[id\]/_components/ContactInfo.tsx app/crm/contactos/\[id\]/_components/ContactHeader.tsx app/crm/contactos/\[id\]/_components/ActivityFeed.tsx
git commit -m "feat(contacts): add contact detail page with info panel and activity feed"
```

---

## Task 8: EditDeleteButtons, AddNoteForm, and Detail Actions

**Files:**
- Create: `app/crm/contactos/[id]/_components/EditDeleteButtons.tsx`
- Create: `app/crm/contactos/[id]/_components/AddNoteForm.tsx`
- Create: `app/crm/contactos/[id]/actions.ts`

- [ ] **Step 1: Create detail actions**

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export { updateContact, deleteContact } from '@/app/crm/contactos/actions'

type NoteState = { error: string } | null

export async function addNote(
  contactId: number,
  prevState: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'La nota no puede estar vacía' }

  await prisma.contactActivity.create({
    data: {
      contactId,
      type: 'NOTE',
      body,
      createdById: Number(session.user.id),
    },
  })

  revalidatePath(`/crm/contactos/${contactId}`)
  return null
}
```

- [ ] **Step 2: Create EditDeleteButtons**

Snippet de referencia (patrón actual: edición en página, no modal). Código completo: `app/crm/contactos/[id]/_components/EditDeleteButtons.tsx`. La variante con `CreateContactModal` está en [`docs/superpowers/archive/2026-05-06-crm-contacts-modales-apendices-historico.md`](../archive/2026-05-06-crm-contacts-modales-apendices-historico.md) (apéndice Task 8).

```typescript
'use client'

import Link from 'next/link'
import { useRef } from 'react'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { deleteContact } from '../actions'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

export function EditDeleteButtons({ contact }: { contact: ContactWithTags }) {
  const formRef = useRef<HTMLFormElement>(null)
  const deleteWithId = deleteContact.bind(null, contact.id)

  function handleDeleteClick() {
    if (window.confirm(`¿Dar de baja a ${contact.name}?`)) {
      formRef.current?.requestSubmit()
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Link href={`/crm/contactos/${contact.id}/editar`}>Editar</Link>
      <form ref={formRef} action={deleteWithId}>
        <button type="button" onClick={handleDeleteClick}>
          Eliminar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create AddNoteForm**

```typescript
'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addNote } from '../actions'

export function AddNoteForm({ contactId }: { contactId: number }) {
  const boundAction = addNote.bind(null, contactId)
  const [state, formAction, isPending] = useActionState(boundAction, null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state === null && textareaRef.current) {
      textareaRef.current.value = ''
    }
  }, [state])

  return (
    <form action={formAction}>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <textarea
          ref={textareaRef}
          name="body"
          rows={3}
          placeholder="Agregar una nota..."
          className="w-full resize-none border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {state?.error && (
          <p className="mb-2 text-xs text-red-600">{state.error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Agregar nota'}
          </button>
        </div>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Full type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Smoke test in browser**

With dev server running, verify:
1. `/crm/contactos` — list loads, filters work, "Nuevo contacto" modal opens and creates a contact
2. `/crm/contactos/[id]` — detail page loads with contact info, activity feed, note form
3. Edit button opens pre-filled modal; changes save and redirect back
4. Delete button shows confirm dialog; on confirm, redirects to list
5. Importing a CSV file shows preview and imports successfully

- [ ] **Step 6: Commit**

```bash
git add app/crm/contactos/\[id\]/actions.ts app/crm/contactos/\[id\]/_components/EditDeleteButtons.tsx app/crm/contactos/\[id\]/_components/AddNoteForm.tsx
git commit -m "feat(contacts): add note form, edit/delete buttons, and detail actions"
```

---

## Done

All tasks produce a working CRM Contacts module:

- `/crm/contactos` — searchable, filterable, paginated contact list
- `/crm/contactos/[id]` — contact detail with two-column layout, activity feed, note form
- Create / edit / delete contacts via modals and server actions
- CSV import with preview and result summary
- Tags — select existing or create new inline
