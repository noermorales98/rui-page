# CRM Webinars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/crm/webinars` — a webinar event manager with per-participant status tracking (Registered → Attended → Purchased), manual contact search, and CSV bulk import.

**Architecture:** Two new Prisma models (`Webinar` + `WebinarRegistration`) with a `RegistrationStatus` enum. A server-component list page and detail page pass data to client components. All mutations go through server actions. No test framework exists — verification uses `npm run build` (TypeScript check) and manual browser testing.

**Tech Stack:** Next.js 16 App Router, Prisma 7 + MariaDB, Zod, React 19 `useActionState`, Tailwind CSS 4.

---

## File Map

**New files:**
- `prisma/schema.prisma` — add `RegistrationStatus` enum, `Webinar` model, `WebinarRegistration` model; add relation to `Contact`
- `app/crm/webinars/actions.ts` — 8 server actions
- `app/crm/webinars/_components/CreateWebinarModal.tsx` — create/edit modal
- `app/crm/webinars/_components/WebinarTable.tsx` — list table with stats
- `app/crm/webinars/[id]/_components/WebinarHeader.tsx` — header with edit/delete
- `app/crm/webinars/[id]/_components/WebinarStats.tsx` — 4 stat boxes
- `app/crm/webinars/[id]/_components/ParticipantsTable.tsx` — table with inline status selector
- `app/crm/webinars/[id]/_components/AddParticipantButton.tsx` — search + create modal
- `app/crm/webinars/[id]/_components/ImportCsvButton.tsx` — CSV file import

**Modified files:**
- `app/crm/webinars/page.tsx` — replace placeholder with real page
- `app/crm/webinars/[id]/page.tsx` — create detail page (new file)

---

## Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `RegistrationStatus` enum and new models**

Open `prisma/schema.prisma`. After the `DealStage` enum (line ~89), add:

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
  platform      String?
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

- [ ] **Step 2: Add relation to Contact model**

In the `Contact` model, add after `deals Deal[]`:

```prisma
registrations WebinarRegistration[]
```

- [ ] **Step 3: Push schema to database**

```bash
npx prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

If you get a pool/connection error, wait 30 seconds and retry — shared hosting has a connection rate limit.

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client (v7.x.x)`

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(webinars): add Webinar and WebinarRegistration models"
```

---

## Task 2: Server Actions

**Files:**
- Create: `app/crm/webinars/actions.ts`

- [ ] **Step 1: Create the actions file**

```ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { RegistrationStatus } from '@prisma/client'

type State = { error: string } | null

const webinarSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
  platform: z.string().optional(),
  link: z.string().optional(),
  description: z.string().optional(),
})

export async function createWebinar(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const parsed = webinarSchema.safeParse({
    title: formData.get('title'),
    date: formData.get('date'),
    platform: (formData.get('platform') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await prisma.webinar.create({
      data: {
        title: parsed.data.title,
        date: new Date(parsed.data.date),
        platform: parsed.data.platform ?? null,
        link: parsed.data.link ?? null,
        description: parsed.data.description ?? null,
      },
    })
  } catch {
    return { error: 'Error al crear el webinar' }
  }

  revalidatePath('/crm/webinars')
  return null
}

export async function updateWebinar(
  id: number,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const parsed = webinarSchema.safeParse({
    title: formData.get('title'),
    date: formData.get('date'),
    platform: (formData.get('platform') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await prisma.webinar.update({
      where: { id },
      data: {
        title: parsed.data.title,
        date: new Date(parsed.data.date),
        platform: parsed.data.platform ?? null,
        link: parsed.data.link ?? null,
        description: parsed.data.description ?? null,
      },
    })
  } catch {
    return { error: 'Error al actualizar el webinar' }
  }

  revalidatePath('/crm/webinars')
  revalidatePath(`/crm/webinars/${id}`)
  return null
}

export async function deleteWebinar(id: number): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.webinar.delete({ where: { id } })
  revalidatePath('/crm/webinars')
}

export async function addRegistration(
  webinarId: number,
  contactId: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    await prisma.webinarRegistration.create({
      data: { webinarId, contactId, status: 'REGISTERED' },
    })
  } catch {
    return { error: 'El contacto ya está registrado en este webinar' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}

export async function createAndRegister(
  webinarId: number,
  name: string,
  email: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    const contact = await prisma.contact.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {},
      create: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        source: 'WEBINAR',
      },
    })

    await prisma.webinarRegistration.upsert({
      where: { webinarId_contactId: { webinarId, contactId: contact.id } },
      update: {},
      create: { webinarId, contactId: contact.id, status: 'REGISTERED' },
    })
  } catch {
    return { error: 'Error al crear el contacto' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  revalidatePath('/crm/contactos')
  return {}
}

export async function updateRegistrationStatus(
  registrationId: number,
  status: RegistrationStatus,
): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const updated = await prisma.webinarRegistration.update({
    where: { id: registrationId },
    data: { status },
  })

  revalidatePath(`/crm/webinars/${updated.webinarId}`)
}

export async function removeRegistration(registrationId: number): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const reg = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    select: { webinarId: true },
  })

  await prisma.webinarRegistration.delete({ where: { id: registrationId } })

  if (reg) revalidatePath(`/crm/webinars/${reg.webinarId}`)
}

export async function importRegistrations(
  webinarId: number,
  rows: { name: string; email: string }[],
): Promise<{ imported: number; skipped: number }> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.email?.trim()) {
      skipped++
      continue
    }

    try {
      const contact = await prisma.contact.upsert({
        where: { email: row.email.trim().toLowerCase() },
        update: {},
        create: {
          name: row.name?.trim() || row.email.trim(),
          email: row.email.trim().toLowerCase(),
          source: 'WEBINAR',
        },
      })

      await prisma.webinarRegistration.upsert({
        where: { webinarId_contactId: { webinarId, contactId: contact.id } },
        update: {},
        create: { webinarId, contactId: contact.id, status: 'REGISTERED' },
      })

      imported++
    } catch {
      skipped++
    }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  revalidatePath('/crm/contactos')
  return { imported, skipped }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add app/crm/webinars/actions.ts
git commit -m "feat(webinars): add server actions"
```

---

## Task 3: CreateWebinarModal

**Files:**
- Create: `app/crm/webinars/_components/CreateWebinarModal.tsx`

- [ ] **Step 1: Create the modal component**

```tsx
'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { createWebinar, updateWebinar } from '../actions'

type WebinarForEdit = {
  id: number
  title: string
  date: Date | string
  platform: string | null
  link: string | null
  description: string | null
}

interface Props {
  webinar?: WebinarForEdit
  onClose: () => void
}

function toDatetimeLocal(date: Date | string): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CreateWebinarModal({ webinar, onClose }: Props) {
  const submittedRef = useRef(false)
  const action = webinar ? updateWebinar.bind(null, webinar.id) : createWebinar
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (submittedRef.current && !isPending && state === null) {
      onClose()
    }
  }, [isPending, state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="webinar-modal-title"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="webinar-modal-title" className="text-lg font-semibold text-gray-900">
            {webinar ? 'Editar webinar' : 'Nuevo webinar'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <form action={formAction} onSubmit={() => { submittedRef.current = true }}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={webinar?.title ?? ''}
              placeholder="ej. Cómo desarrollar tu voz"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fecha y hora <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              required
              defaultValue={webinar ? toDatetimeLocal(webinar.date) : ''}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Plataforma <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              name="platform"
              defaultValue={webinar?.platform ?? ''}
              placeholder="ej. Zoom"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Link <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="url"
              name="link"
              defaultValue={webinar?.link ?? ''}
              placeholder="https://zoom.us/j/..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descripción <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="description"
              defaultValue={webinar?.description ?? ''}
              rows={3}
              placeholder="Tema, audiencia objetivo..."
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
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? 'Guardando...' : webinar ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/crm/webinars/_components/CreateWebinarModal.tsx
git commit -m "feat(webinars): add CreateWebinarModal"
```

---

## Task 4: List Page + WebinarTable

**Files:**
- Create: `app/crm/webinars/_components/WebinarTable.tsx`
- Modify: `app/crm/webinars/page.tsx`

- [ ] **Step 1: Create WebinarTable**

```tsx
'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { RegistrationStatus } from '@prisma/client'
import { deleteWebinar } from '../actions'
import { CreateWebinarModal } from './CreateWebinarModal'

export type WebinarWithStats = {
  id: number
  title: string
  date: Date | string
  platform: string | null
  link: string | null
  description: string | null
  registrations: { status: RegistrationStatus }[]
}

function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

interface Props {
  webinars: WebinarWithStats[]
}

export function WebinarTable({ webinars }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editWebinar, setEditWebinar] = useState<WebinarWithStats | null>(null)

  function handleDelete(e: React.MouseEvent, w: WebinarWithStats) {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar "${w.title}"? Se perderán todos los registros.`)) return
    startTransition(async () => {
      await deleteWebinar(w.id)
    })
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <span className="text-sm text-gray-500">
            {webinars.length} webinar{webinars.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Nuevo webinar
          </button>
        </div>

        {webinars.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No hay webinars todavía. ¡Crea el primero!
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide">
                <th className="px-6 py-3 text-left text-gray-500">Webinar</th>
                <th className="px-4 py-3 text-left text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-center text-indigo-600">Reg.</th>
                <th className="px-4 py-3 text-center text-yellow-600">Asist.</th>
                <th className="px-4 py-3 text-center text-green-600">Compró</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {webinars.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => router.push(`/crm/webinars/${w.id}`)}
                  className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{w.title}</div>
                    {w.platform && (
                      <div className="mt-0.5 text-xs text-gray-400">{w.platform}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatDateShort(w.date)}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-indigo-600">
                    {w.registrations.length}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-yellow-600">
                    {w.registrations.filter(
                      (r) => r.status === 'ATTENDED' || r.status === 'PURCHASED',
                    ).length}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-green-600">
                    {w.registrations.filter((r) => r.status === 'PURCHASED').length}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditWebinar(w) }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                          <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
                          <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, w)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && <CreateWebinarModal onClose={() => setCreateOpen(false)} />}
      {editWebinar && (
        <CreateWebinarModal webinar={editWebinar} onClose={() => setEditWebinar(null)} />
      )}
    </>
  )
}
```

- [ ] **Step 2: Replace `app/crm/webinars/page.tsx`**

```tsx
import { prisma } from '@/lib/prisma'
import { WebinarTable } from './_components/WebinarTable'
import type { WebinarWithStats } from './_components/WebinarTable'

export default async function WebinarsPage() {
  const webinars = await prisma.webinar.findMany({
    orderBy: { date: 'desc' },
    include: {
      registrations: {
        select: { status: true },
      },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webinars</h1>
        <p className="mt-1 text-sm text-gray-500">Gestión de eventos y participantes</p>
      </div>
      <WebinarTable webinars={webinars as WebinarWithStats[]} />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

- [ ] **Step 4: Test in browser**

Open http://localhost:3000/crm/webinars. You should see an empty table with "No hay webinars todavía." and a "+ Nuevo webinar" button. Click it, fill in a title and date, and submit. The webinar should appear in the table.

- [ ] **Step 5: Commit**

```bash
git add app/crm/webinars/page.tsx app/crm/webinars/_components/WebinarTable.tsx
git commit -m "feat(webinars): add list page and WebinarTable"
```

---

## Task 5: Detail Page + WebinarHeader + WebinarStats

**Files:**
- Create: `app/crm/webinars/[id]/page.tsx`
- Create: `app/crm/webinars/[id]/_components/WebinarHeader.tsx`
- Create: `app/crm/webinars/[id]/_components/WebinarStats.tsx`

- [ ] **Step 1: Create WebinarHeader**

```tsx
'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWebinar } from '../../actions'
import { CreateWebinarModal } from '../../_components/CreateWebinarModal'

type WebinarForHeader = {
  id: number
  title: string
  date: Date | string
  platform: string | null
  link: string | null
  description: string | null
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

interface Props {
  webinar: WebinarForHeader
}

export function WebinarHeader({ webinar }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)

  function handleDelete() {
    if (!window.confirm(`¿Eliminar "${webinar.title}"? Se perderán todos los registros.`)) return
    startTransition(async () => {
      await deleteWebinar(webinar.id)
      router.push('/crm/webinars')
    })
  }

  return (
    <>
      <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{webinar.title}</h1>
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>{formatDate(webinar.date)}</span>
            {webinar.platform && <span>{webinar.platform}</span>}
            {webinar.link && (
              <a
                href={webinar.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Ver enlace
              </a>
            )}
          </div>
          {webinar.description && (
            <p className="mt-2 text-sm text-gray-500">{webinar.description}</p>
          )}
        </div>
        <div className="ml-4 flex flex-shrink-0 gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editOpen && (
        <CreateWebinarModal webinar={webinar} onClose={() => setEditOpen(false)} />
      )}
    </>
  )
}
```

- [ ] **Step 2: Create WebinarStats**

```tsx
import type { RegistrationStatus } from '@prisma/client'

interface Props {
  registrations: { status: RegistrationStatus }[]
}

export function WebinarStats({ registrations }: Props) {
  const total = registrations.length
  const attended = registrations.filter(
    (r) => r.status === 'ATTENDED' || r.status === 'PURCHASED',
  ).length
  const purchased = registrations.filter((r) => r.status === 'PURCHASED').length
  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : 0

  return (
    <div className="flex flex-wrap gap-4">
      <div className="rounded-lg bg-indigo-50 px-5 py-3 text-center">
        <div className="text-2xl font-bold text-indigo-600">{total}</div>
        <div className="text-xs text-gray-500">Registrados</div>
      </div>
      <div className="rounded-lg bg-yellow-50 px-5 py-3 text-center">
        <div className="text-2xl font-bold text-yellow-600">{attended}</div>
        <div className="text-xs text-gray-500">Asistieron</div>
      </div>
      <div className="rounded-lg bg-green-50 px-5 py-3 text-center">
        <div className="text-2xl font-bold text-green-600">{purchased}</div>
        <div className="text-xs text-gray-500">Compraron</div>
      </div>
      <div className="rounded-lg bg-gray-50 px-5 py-3 text-center">
        <div className="text-2xl font-bold text-gray-500">{attendancePct}%</div>
        <div className="text-xs text-gray-500">Asistencia</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create the detail page (shell — ParticipantsTable and buttons added in later tasks)**

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WebinarHeader } from './_components/WebinarHeader'
import { WebinarStats } from './_components/WebinarStats'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WebinarDetailPage({ params }: Props) {
  const { id } = await params
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      registrations: {
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!webinar) notFound()

  return (
    <div>
      <a
        href="/crm/webinars"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Webinars
      </a>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <WebinarHeader webinar={webinar} />
        <div className="p-6">
          <WebinarStats registrations={webinar.registrations} />
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              Participantes ({webinar.registrations.length})
            </h3>
            <p className="text-sm text-gray-400">
              (Los controles de participantes se añaden en las siguientes tareas)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build
```

- [ ] **Step 5: Test in browser**

Click a webinar row from the list. You should land on the detail page with the header (title, formatted date, platform) and the 4 stat boxes.

- [ ] **Step 6: Commit**

```bash
git add app/crm/webinars/[id]/page.tsx \
        app/crm/webinars/[id]/_components/WebinarHeader.tsx \
        app/crm/webinars/[id]/_components/WebinarStats.tsx
git commit -m "feat(webinars): add detail page with header and stats"
```

---

## Task 6: ParticipantsTable

**Files:**
- Create: `app/crm/webinars/[id]/_components/ParticipantsTable.tsx`
- Modify: `app/crm/webinars/[id]/page.tsx`

- [ ] **Step 1: Create ParticipantsTable**

```tsx
'use client'

import { useState, startTransition } from 'react'
import type { RegistrationStatus } from '@prisma/client'
import { updateRegistrationStatus, removeRegistration } from '../../actions'

export type RegistrationWithContact = {
  id: number
  status: RegistrationStatus
  createdAt: Date | string
  contactId: number
  contact: { id: number; name: string; email: string }
}

const STATUS_OPTIONS: { value: RegistrationStatus; label: string; colorClass: string }[] = [
  { value: 'REGISTERED', label: 'Registrado', colorClass: 'bg-indigo-50 text-indigo-700' },
  { value: 'ATTENDED', label: 'Asistió', colorClass: 'bg-yellow-50 text-yellow-700' },
  { value: 'PURCHASED', label: 'Compró', colorClass: 'bg-green-50 text-green-700' },
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
  registrations: RegistrationWithContact[]
}

export function ParticipantsTable({ registrations }: Props) {
  const [statuses, setStatuses] = useState<Record<number, RegistrationStatus>>(
    Object.fromEntries(registrations.map((r) => [r.id, r.status])),
  )

  function handleStatusChange(registrationId: number, status: RegistrationStatus) {
    setStatuses((prev) => ({ ...prev, [registrationId]: status }))
    startTransition(async () => {
      await updateRegistrationStatus(registrationId, status)
    })
  }

  function handleRemove(reg: RegistrationWithContact) {
    if (!window.confirm(`¿Quitar a ${reg.contact.name} de este webinar?`)) return
    startTransition(async () => {
      await removeRegistration(reg.id)
    })
  }

  if (registrations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
        No hay participantes todavía. Agrega contactos o importa un CSV.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 text-left">Contacto</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-left">Agregado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => {
            const currentStatus = statuses[reg.id] ?? reg.status
            const statusConfig = STATUS_OPTIONS.find((s) => s.value === currentStatus)
            return (
              <tr key={reg.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">
                  <a
                    href={`/crm/contactos/${reg.contact.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {reg.contact.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{reg.contact.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={currentStatus}
                    onChange={(e) =>
                      handleStatusChange(reg.id, e.target.value as RegistrationStatus)
                    }
                    className={`rounded-lg border-0 py-1 pl-2 pr-6 text-xs font-medium ring-1 ring-gray-200 focus:outline-none focus:ring-indigo-400 ${statusConfig?.colorClass ?? ''}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {relativeTime(reg.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(reg)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Quitar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Update `app/crm/webinars/[id]/page.tsx` — add ParticipantsTable**

Replace the entire file with:

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WebinarHeader } from './_components/WebinarHeader'
import { WebinarStats } from './_components/WebinarStats'
import { ParticipantsTable } from './_components/ParticipantsTable'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WebinarDetailPage({ params }: Props) {
  const { id } = await params
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      registrations: {
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!webinar) notFound()

  return (
    <div>
      <a
        href="/crm/webinars"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Webinars
      </a>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <WebinarHeader webinar={webinar} />
        <div className="p-6">
          <WebinarStats registrations={webinar.registrations} />
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              Participantes ({webinar.registrations.length})
            </h3>
            <ParticipantsTable registrations={webinar.registrations} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/crm/webinars/[id]/_components/ParticipantsTable.tsx \
        app/crm/webinars/[id]/page.tsx
git commit -m "feat(webinars): add ParticipantsTable with inline status selector"
```

---

## Task 7: AddParticipantButton

**Files:**
- Create: `app/crm/webinars/[id]/_components/AddParticipantButton.tsx`
- Modify: `app/crm/webinars/[id]/page.tsx`

- [ ] **Step 1: Create AddParticipantButton**

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { addRegistration, createAndRegister } from '../../actions'

interface ContactOption {
  id: number
  name: string
  email: string
}

interface Props {
  webinarId: number
  registeredContactIds: number[]
}

export function AddParticipantButton({ webinarId, registeredContactIds }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContactOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowDropdown(false)
      return
    }

    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/crm/contacts-search?q=${encodeURIComponent(query)}`,
        )
        if (res.ok) {
          const data = (await res.json()) as ContactOption[]
          setResults(data)
          setShowDropdown(data.length > 0)
        }
      } catch {
        // ignore network errors
      }
    }, 300)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [query])

  async function handleSelect(contact: ContactOption) {
    if (registeredContactIds.includes(contact.id)) return
    setLoading(true)
    setError(null)
    const result = await addRegistration(webinarId, contact.id)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      handleClose()
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !newEmail.trim()) return
    setLoading(true)
    setError(null)
    const result = await createAndRegister(webinarId, newName.trim(), newEmail.trim())
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      handleClose()
    }
  }

  function handleClose() {
    setOpen(false)
    setMode('search')
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setNewName('')
    setNewEmail('')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Agregar contacto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-participant-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="add-participant-title" className="text-base font-semibold text-gray-900">
                Agregar participante
              </h2>
              <button
                onClick={handleClose}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {mode === 'search' ? (
              <>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Buscar por nombre o email..."
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {results.map((c) => {
                        const alreadyAdded = registeredContactIds.includes(c.id)
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              disabled={alreadyAdded || loading}
                              onMouseDown={() => handleSelect(c)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span className="font-medium text-gray-900">{c.name}</span>
                              <span className="ml-2 text-xs text-gray-400">{c.email}</span>
                              {alreadyAdded && (
                                <span className="ml-2 text-xs text-indigo-400">ya registrado</span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="mt-3 text-sm text-indigo-600 hover:underline"
                >
                  ¿No está en la lista? Crear nuevo contacto
                </button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre completo"
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className="mt-2 text-sm text-gray-500 hover:underline"
                >
                  ← Volver a buscar
                </button>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={loading || !newName.trim() || !newEmail.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {loading ? 'Creando...' : 'Crear y agregar'}
                  </button>
                </div>
              </>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Update `app/crm/webinars/[id]/page.tsx` — add button row above table**

Replace the entire file:

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WebinarHeader } from './_components/WebinarHeader'
import { WebinarStats } from './_components/WebinarStats'
import { ParticipantsTable } from './_components/ParticipantsTable'
import { AddParticipantButton } from './_components/AddParticipantButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WebinarDetailPage({ params }: Props) {
  const { id } = await params
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      registrations: {
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!webinar) notFound()

  const registeredContactIds = webinar.registrations.map((r) => r.contactId)

  return (
    <div>
      <a
        href="/crm/webinars"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Webinars
      </a>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <WebinarHeader webinar={webinar} />
        <div className="p-6">
          <WebinarStats registrations={webinar.registrations} />
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Participantes ({webinar.registrations.length})
              </h3>
              <AddParticipantButton
                webinarId={webinarId}
                registeredContactIds={registeredContactIds}
              />
            </div>
            <ParticipantsTable registrations={webinar.registrations} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

- [ ] **Step 4: Test in browser**

Open a webinar detail page. Click "Agregar contacto", search for an existing contact, and select them. They should appear in the table as "Registrado". Then click "¿No está en la lista?" and create a new contact with a name and email. Verify it appears in both the webinar table and `/crm/contactos`.

- [ ] **Step 5: Commit**

```bash
git add app/crm/webinars/[id]/_components/AddParticipantButton.tsx \
        app/crm/webinars/[id]/page.tsx
git commit -m "feat(webinars): add AddParticipantButton with contact search and create"
```

---

## Task 8: ImportCsvButton

**Files:**
- Create: `app/crm/webinars/[id]/_components/ImportCsvButton.tsx`
- Modify: `app/crm/webinars/[id]/page.tsx`

- [ ] **Step 1: Create ImportCsvButton**

```tsx
'use client'

import { useRef, useState } from 'react'
import { importRegistrations } from '../../actions'

interface Props {
  webinarId: number
}

export function ImportCsvButton({ webinarId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) {
      alert('El CSV está vacío o no tiene datos.')
      return
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''))
    const nameIdx = headers.findIndex((h) => h === 'nombre' || h === 'name')
    const emailIdx = headers.findIndex((h) => h === 'email' || h === 'correo')

    if (emailIdx === -1) {
      alert('El CSV debe tener una columna llamada "email" o "correo".')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const rows = lines
      .slice(1)
      .map((line) => {
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        return {
          name: nameIdx !== -1 ? (cols[nameIdx] ?? '') : (cols[emailIdx] ?? ''),
          email: cols[emailIdx] ?? '',
        }
      })
      .filter((r) => r.email.trim())

    if (rows.length === 0) {
      alert('No se encontraron filas válidas en el CSV.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setLoading(true)
    setResult(null)
    const res = await importRegistrations(webinarId, rows)
    setLoading(false)
    setResult(res)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
      >
        {loading ? (
          'Importando...'
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            Importar CSV
          </>
        )}
      </button>
      {result && (
        <span className="text-xs text-gray-500">
          {result.imported} importados
          {result.skipped > 0 ? `, ${result.skipped} omitidos` : ''}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `app/crm/webinars/[id]/page.tsx` — add ImportCsvButton**

Replace the entire file with the final version:

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WebinarHeader } from './_components/WebinarHeader'
import { WebinarStats } from './_components/WebinarStats'
import { ParticipantsTable } from './_components/ParticipantsTable'
import { AddParticipantButton } from './_components/AddParticipantButton'
import { ImportCsvButton } from './_components/ImportCsvButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WebinarDetailPage({ params }: Props) {
  const { id } = await params
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      registrations: {
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!webinar) notFound()

  const registeredContactIds = webinar.registrations.map((r) => r.contactId)

  return (
    <div>
      <a
        href="/crm/webinars"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Webinars
      </a>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <WebinarHeader webinar={webinar} />
        <div className="p-6">
          <WebinarStats registrations={webinar.registrations} />
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Participantes ({webinar.registrations.length})
              </h3>
              <div className="flex gap-2">
                <ImportCsvButton webinarId={webinarId} />
                <AddParticipantButton
                  webinarId={webinarId}
                  registeredContactIds={registeredContactIds}
                />
              </div>
            </div>
            <ParticipantsTable registrations={webinar.registrations} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify final TypeScript build**

```bash
npm run build
```

Expected: zero errors.

- [ ] **Step 4: Test CSV import**

Create a file `test.csv` with this content:

```
nombre,email
Juan Pérez,juan@ejemplo.com
Ana López,ana@ejemplo.com
```

Open a webinar detail page. Click "Importar CSV" and select the file. You should see "2 importados" and both contacts appear in the participants table.

- [ ] **Step 5: Commit**

```bash
git add app/crm/webinars/[id]/_components/ImportCsvButton.tsx \
        app/crm/webinars/[id]/page.tsx
git commit -m "feat(webinars): add ImportCsvButton for bulk CSV registration"
```
