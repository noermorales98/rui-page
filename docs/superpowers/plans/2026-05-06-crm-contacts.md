# CRM Contacts Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full CRM Contacts module at `/crm/contactos` — list with filters + pagination, detail page with activity feed, CSV import, and create/edit/delete operations.

**Architecture:** Server components fetch and render data; client components handle interactivity (filters, modals, forms). Server actions in `actions.ts` files handle all mutations. URL search params drive filtering and pagination — no client-side state for those.

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
| `app/crm/contactos/_components/CreateContactModal.tsx` | Create | Client component — create or edit a contact, uses `useActionState` |
| `app/crm/contactos/_components/ImportCsvModal.tsx` | Create | Client component — file picker, CSV parser, preview, calls `importContacts` |
| `app/crm/contactos/[id]/page.tsx` | Create | Server component — fetches contact + activities, two-column layout |
| `app/crm/contactos/[id]/actions.ts` | Create | `addNote`; re-exports `updateContact`/`deleteContact` from parent |
| `app/crm/contactos/[id]/_components/ContactHeader.tsx` | Create | Server component — avatar initials, name, status badge, tags |
| `app/crm/contactos/[id]/_components/EditDeleteButtons.tsx` | Create | Client component — opens edit modal; confirm + call `deleteContact` |
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

```typescript
import { prisma } from '@/lib/prisma'
import { ContactsTable } from './_components/ContactsTable'
import { ContactFilters } from './_components/ContactFilters'
import { CreateContactModal } from './_components/CreateContactModal'
import { ImportCsvModal } from './_components/ImportCsvModal'

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{
    q?: string
    status?: string
    source?: string
    tag?: string
    page?: string
  }>
}

export default async function ContactosPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const status = params.status ?? ''
  const source = params.source ?? ''
  const tagId = params.tag ? Number(params.tag) : undefined
  const page = Math.max(1, Number(params.page ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
    ...(status ? { status: status as 'NEW' | 'QUALIFIED' | 'CLIENT' } : {}),
    ...(source ? { source: source as 'WEBINAR' | 'FORM' | 'MANUAL' | 'IMPORT' } : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
  }

  const [contacts, total, allTags] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.contact.count({ where }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} {total === 1 ? 'contacto' : 'contactos'}
          </p>
        </div>
        <div className="flex gap-2">
          <ImportCsvModal />
          <CreateContactModal tags={allTags} />
        </div>
      </div>

      {/* Filters */}
      <ContactFilters tags={allTags} />

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <ContactsTable contacts={contacts} />
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Anterior
              </a>
            )}
            {skip + PAGE_SIZE < total && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Siguiente
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "contactos/page"
```

Expected: Errors will mention missing `ContactsTable`, `ContactFilters`, `CreateContactModal`, `ImportCsvModal` — those are fine for now (components not yet created). Zero other errors.

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

## Task 5: CreateContactModal

**Files:**
- Create: `app/crm/contactos/_components/CreateContactModal.tsx`

- [ ] **Step 1: Create CreateContactModal**

```typescript
'use client'

import { useState, useActionState, useEffect } from 'react'
import type { Tag, Contact, ContactTag } from '@prisma/client'
import { createContact, updateContact } from '../actions'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

interface Props {
  tags: Tag[]
  contact?: ContactWithTags
  trigger?: React.ReactNode
}

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'FORM', label: 'Formulario' },
  { value: 'IMPORT', label: 'Importado' },
]

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'QUALIFIED', label: 'Calificado' },
  { value: 'CLIENT', label: 'Cliente' },
]

export function CreateContactModal({ tags, contact, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    contact ? contact.tags.map((ct) => ct.tagId) : [],
  )
  const [newTagInput, setNewTagInput] = useState('')
  const [newTagNames, setNewTagNames] = useState<string[]>([])

  const action = contact
    ? updateContact.bind(null, contact.id)
    : createContact

  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state === null && submitted) {
      setOpen(false)
      setSubmitted(false)
      setNewTagNames([])
      setNewTagInput('')
    }
  }, [state, submitted])

  function handleOpen() {
    setSelectedTagIds(contact ? contact.tags.map((ct) => ct.tagId) : [])
    setNewTagNames([])
    setNewTagInput('')
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setSubmitted(false)
  }

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function addNewTag() {
    const name = newTagInput.trim()
    if (name && !newTagNames.includes(name)) {
      setNewTagNames((prev) => [...prev, name])
    }
    setNewTagInput('')
  }

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Nuevo contacto
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {contact ? 'Editar contacto' : 'Nuevo contacto'}
              </h2>
              <button onClick={handleClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <form
              key={open ? 'open' : 'closed'}
              action={(fd) => {
                // Inject selected tag IDs and new tag names into FormData
                selectedTagIds.forEach((id) => fd.append('tagIds', String(id)))
                newTagNames.forEach((name) => fd.append('newTagNames', name))
                setSubmitted(true)
                formAction(fd)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    defaultValue={contact?.name}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={contact?.email}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={contact?.phone ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fuente</label>
                  <select
                    name="source"
                    defaultValue={contact?.source ?? 'MANUAL'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    name="status"
                    defaultValue={contact?.status ?? 'NEW'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded px-2.5 py-1 text-xs font-medium text-white transition-opacity ${selectedTagIds.includes(tag.id) ? 'opacity-100 ring-2 ring-offset-1 ring-indigo-500' : 'opacity-50'}`}
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                {newTagNames.map((name) => (
                  <span key={name} className="mr-1 inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                    {name}
                    <button type="button" onClick={() => setNewTagNames((p) => p.filter((n) => n !== name))}>×</button>
                  </span>
                ))}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nuevo tag..."
                  />
                  <button
                    type="button"
                    onClick={addNewTag}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isPending ? 'Guardando...' : contact ? 'Guardar cambios' : 'Crear contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "CreateContactModal"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/crm/contactos/_components/CreateContactModal.tsx
git commit -m "feat(contacts): add CreateContactModal for create and edit"
```

---

## Task 6: ImportCsvModal

**Files:**
- Create: `app/crm/contactos/_components/ImportCsvModal.tsx`

- [ ] **Step 1: Create ImportCsvModal**

```typescript
'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { importContacts } from '../actions'

type Row = { name: string; email: string; phone?: string; source?: string }

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim())

  const nameIdx = headers.findIndex((h) => h === 'nombre' || h === 'name')
  const emailIdx = headers.findIndex((h) => h === 'email')
  const phoneIdx = headers.findIndex((h) => h === 'telefono' || h === 'phone' || h === 'teléfono')
  const sourceIdx = headers.findIndex((h) => h === 'fuente' || h === 'source')

  if (nameIdx === -1 || emailIdx === -1) return []

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line)
    return {
      name: cols[nameIdx]?.trim() ?? '',
      email: cols[emailIdx]?.trim() ?? '',
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() : undefined,
      source: sourceIdx >= 0 ? cols[sourceIdx]?.trim().toUpperCase() : undefined,
    }
  })
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export function ImportCsvModal() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [state, formAction, isPending] = useActionState(importContacts, null)

  useEffect(() => {
    if (state !== null && submitted) {
      // stay open to show result
    }
  }, [state, submitted])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCsv(text))
    }
    reader.readAsText(file)
  }

  function handleClose() {
    setOpen(false)
    setRows([])
    setSubmitted(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.19l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
        </svg>
        Importar CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Importar contactos desde CSV</h2>
              <button onClick={handleClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              El CSV debe tener cabecera con columnas: <code className="rounded bg-gray-100 px-1">nombre</code>, <code className="rounded bg-gray-100 px-1">email</code> (requeridas), <code className="rounded bg-gray-100 px-1">telefono</code>, <code className="rounded bg-gray-100 px-1">fuente</code> (opcionales).
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mb-4 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />

            {rows.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Vista previa — primeras 5 filas de {rows.length} detectadas:
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Nombre', 'Email', 'Teléfono', 'Fuente'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.email}</td>
                          <td className="px-3 py-2">{row.phone ?? '—'}</td>
                          <td className="px-3 py-2">{row.source ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {state && submitted && (
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                Importados: <strong>{state.imported}</strong> · Omitidos: <strong>{state.skipped}</strong>
                {state.errors.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Errores en: {state.errors.slice(0, 5).join(', ')}
                    {state.errors.length > 5 && ` y ${state.errors.length - 5} más`}
                  </p>
                )}
              </div>
            )}

            <form
              action={(fd) => {
                fd.set('rows', JSON.stringify(rows))
                setSubmitted(true)
                formAction(fd)
              }}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {state && submitted ? 'Cerrar' : 'Cancelar'}
                </button>
                {rows.length > 0 && !(state && submitted) && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isPending ? 'Importando...' : `Importar ${rows.length} contactos`}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "ImportCsvModal"
```

Expected: no output.

- [ ] **Step 3: Start dev server and verify list page works**

```bash
npm run dev
```

Navigate to `http://localhost:3000/crm/contactos`. Verify:
- Page loads without errors
- "Nuevo contacto" button opens modal
- "Importar CSV" button opens modal
- Filters are visible
- Empty state message shows

- [ ] **Step 4: Commit**

```bash
git add app/crm/contactos/_components/ImportCsvModal.tsx
git commit -m "feat(contacts): add ImportCsvModal with CSV parser and preview"
```

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

  const [contact, allTags] = await Promise.all([
    prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        tags: { include: { tag: true } },
        activities: {
          include: { createdBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

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
            <ContactHeader contact={contact} allTags={allTags} />
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
  allTags,
}: {
  contact: ContactWithTags
  allTags: Tag[]
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

      <EditDeleteButtons contact={contact} allTags={allTags} />
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

```typescript
'use client'

import { useRef } from 'react'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { deleteContact } from '../actions'
import { CreateContactModal } from '../../_components/CreateContactModal'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

export function EditDeleteButtons({
  contact,
  allTags,
}: {
  contact: ContactWithTags
  allTags: Tag[]
}) {
  const formRef = useRef<HTMLFormElement>(null)

  function handleDeleteClick() {
    if (window.confirm(`¿Eliminar a ${contact.name}? Esta acción no se puede deshacer.`)) {
      formRef.current?.requestSubmit()
    }
  }

  const deleteWithId = deleteContact.bind(null, contact.id)

  return (
    <div className="flex flex-shrink-0 gap-2">
      <CreateContactModal
        tags={allTags}
        contact={contact}
        trigger={
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Editar
          </button>
        }
      />
      <form ref={formRef} action={deleteWithId} className="inline">
        <button
          type="button"
          onClick={handleDeleteClick}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
        >
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
