# Archivo histórico: CRM contactos — modales y apéndices

**Ubicación:** `docs/superpowers/archive/2026-05-06-crm-contacts-modales-apendices-historico.md`  
**Origen:** `docs/superpowers/plans/2026-05-06-crm-contacts.md` (extraído en mayo 2026). Índice de esta carpeta: [`README.md`](README.md).

**Estado:** Obsoleto. En el repo actual: `ContactForm`, rutas `/crm/contactos/nuevo`, `/crm/contactos/[id]/editar`, `CsvImporter` y `/crm/contactos/importar` (import en servidor, `lib/utils/csv.ts`).

---

## Task 5: CreateContactModal (histórico)

> En el código actual esto está sustituido por `ContactForm` y las rutas `/crm/contactos/nuevo` y `/crm/contactos/[id]/editar`. El bloque siguiente conserva el plan original como referencia.

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

## Task 6: ImportCsvModal (histórico)

> Sustituido por `/crm/contactos/importar` + `CsvImporter` e import en servidor. Referencia del plan original a continuación.

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

## Apéndice: Task 3 — snippet de listado con modales (obsoleto)

El plan original montaba `ImportCsvModal` y `CreateContactModal` en el header. Sustituido por `Link` a `/crm/contactos/importar` y `/crm/contactos/nuevo`.

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

---

## Apéndice: Task 8 — EditDeleteButtons con modal de edición (obsoleto)

Sustituido por `Link` a `/crm/contactos/[id]/editar`. Ver `app/crm/contactos/[id]/_components/EditDeleteButtons.tsx` en el repo.

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
