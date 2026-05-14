# CRM Contacts Module Design

## Goal

Build a fully functional Contacts module at `/crm/contactos` for managing webinar leads and CRM contacts. Includes a paginated filterable list, a full detail page per contact, CSV import, and an extensible activity feed.

> **Actualización (mayo 2026):** Alta y edición de contactos viven en rutas dedicadas (`/crm/contactos/nuevo`, `/crm/contactos/[id]/editar`) con `ContactForm.tsx`. La importación CSV usa `/crm/contactos/importar` con `CsvImporter.tsx` y el flujo servidor (`lib/utils/csv.ts`, acción de importación desde archivo). En el detalle, el timeline puede importarse como `ActivityTimeline` (reexporta `ActivityFeed`). Estilos CRM compartidos: `app/crm/_lib/ui-tokens.ts` (`TOK`).

## Tech Stack

- Next.js 16 App Router — server components + server actions + URL search params
- Prisma 7 + MariaDB (existing `lib/prisma.ts` singleton)
- React 19 `useActionState` for forms
- Tailwind CSS v4
- Zod for server-side validation

---

## Data Model

Four new Prisma models added to `prisma/schema.prisma`:

```prisma
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

`ContactActivity.createdById` is nullable — null means the activity was created automatically by another module (email sent, course purchased, etc.).

The `User` model needs a new relation field:
```prisma
// Add to existing User model:
activities ContactActivity[]
```

---

## Routes & File Structure

```
app/crm/contactos/
├── page.tsx                          ← server component: fetches contacts with filters
├── nuevo/page.tsx                    ← server + ContactForm: crear contacto
├── importar/page.tsx                 ← server + CsvImporter: importar CSV
├── _components/
│   ├── ContactsTable.tsx             ← client component: renders table rows
│   ├── ContactFilters.tsx            ← client component: search + status/source/tag selects
│   ├── ContactForm.tsx               ← client component: create/edit (useActionState)
│   └── CsvImporter.tsx               ← client component: file upload → server import
├── actions.ts                        ← 'use server': mutations + import desde archivo
└── [id]/
    ├── page.tsx                      ← server component: fetches contact + activities
    ├── editar/page.tsx               ← server + ContactForm: editar contacto
    ├── _components/
    │   ├── ContactHeader.tsx         ← server component: name, status badge, tags
    │   ├── EditDeleteButtons.tsx     ← client component: links a editar + delete
    │   ├── ContactInfo.tsx           ← server component: email, phone, source, date
    │   ├── ActivityFeed.tsx          ← server component: chronological activity list
    │   ├── ActivityTimeline.tsx      ← reexport alias → ActivityFeed
    │   └── AddNoteForm.tsx           ← client component: add note form
    └── actions.ts                    ← 'use server': addNote (imports updateContact,
                                         deleteContact from parent actions.ts)
```

---

## Contact List Page (`page.tsx`)

Server component. Reads URL search params:

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by name or email (case-insensitive LIKE) |
| `status` | `NEW\|QUALIFIED\|CLIENT` | Filter by status |
| `source` | `WEBINAR\|FORM\|MANUAL\|IMPORT` | Filter by source |
| `tag` | string (tag id) | Filter by tag |
| `page` | number | Pagination, 50 per page |

Prisma query uses `where` with all active filters combined. Renders:
- Page heading "Contactos" with total count
- `<ContactFilters>` — syncs with URL params
- `<ContactsTable>` — receives contacts array as prop
- "Nuevo contacto" → enlace a `/crm/contactos/nuevo` (`ContactForm`)
- "Importar CSV" → enlace a `/crm/contactos/importar` (`CsvImporter`)

### ContactsTable

Client component. Columns: Nombre, Email, Teléfono, Estado, Tags, Fuente, Fecha. Each row links to `/crm/contactos/[id]`. Status shown as colored badge (NEW=gray, QUALIFIED=yellow, CLIENT=green). Tags shown as small colored chips.

### ContactFilters

Client component. Uses `useRouter` + `useSearchParams`. Inputs:
- Text input for `q` (debounced 300ms with `setTimeout`)
- Select for `status` (Todos / Nuevo / Calificado / Cliente)
- Select for `source` (Todas / Webinar / Formulario / Manual / Importado)
- Select for `tag` (populated from all tags fetched server-side, passed as prop)

On change, calls `router.push` with updated search params, preserving other active params.

---

## Contact Detail Page (`[id]/page.tsx`)

Server component. Fetches contact with `include: { tags: { include: { tag: true } }, activities: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } } }`.

Redirects to `/crm/contactos` with `notFound()` if contact doesn't exist.

Layout: two-column flex row.

**Left column (fixed 280px):** `<ContactInfo>` — displays email, phone, source, creation date as labeled fields.

**Right column (flex-1):** `<ContactHeader>` at top (name, status badge, tags, Edit/Delete buttons), then `<AddNoteForm>`, then `<ActivityTimeline>` o `<ActivityFeed>` (mismo componente).

### ContactHeader

Server component. Renders name with avatar initials (first letter of first + last name, indigo background), status badge, and tag chips. Renders `<EditDeleteButtons contact={contact} tags={allTags} />` for interactive actions.

### EditDeleteButtons

Client component. Receives the full contact object and all available tags as props. Renders:
- "Editar" → navegación a `/crm/contactos/[id]/editar` con `ContactForm` precargado
- "Eliminar" button → shows inline confirmation (`window.confirm`), then calls `deleteContact(id)`

### ActivityFeed

Server component. Receives activities array. Each item shows:
- Icon by type: 📝 NOTE, ✉️ EMAIL_SENT, 🎓 COURSE_PURCHASED, 📅 WEBINAR_REGISTERED/ATTENDED
- Body text or auto-generated description
- Timestamp (relative: "hace 2 días") + author name or "automático"

### AddNoteForm

Client component. Textarea + "Agregar nota" button. Uses `useActionState` with `addNote` action. Clears textarea on success.

---

## Server Actions

### `app/crm/contactos/actions.ts`

**`createContact(prevState, formData)`**
- Fields: name (required, min 2), email (required, valid email), phone (optional), source (enum), status (enum), tagIds (array of existing tag IDs), newTagNames (array of new tag names to create)
- Upserts new tags, creates contact with tag relations
- On P2002 (duplicate email): returns `{ error: 'Este email ya está registrado' }`
- On success: `revalidatePath('/crm/contactos')`, return `null`

**`updateContact(id, prevState, formData)`**
- Same fields as create
- Deletes all existing `ContactTag` for the contact, re-creates with new selection
- On success: `revalidatePath('/crm/contactos')`, `revalidatePath('/crm/contactos/' + id)`, return `null`

**`deleteContact(id)`**
- Deletes contact (cascade deletes tags and activities)
- `revalidatePath('/crm/contactos')`, redirect to `/crm/contactos`

**`importContacts(prevState, formData)`**
- Receives `rows` as JSON string: `Array<{ name, email, phone?, source? }>`
- Validates each row with Zod (skip rows with missing name or invalid email)
- Bulk upsert: `prisma.contact.upsert` per row (update phone/source if email exists, otherwise create)
- Returns `{ imported: N, skipped: N, errors: string[] }` — never throws, always reports

**`upsertTag(name, color)`**
- Creates tag if it doesn't exist, returns the tag (used by the contact modal)

### `app/crm/contactos/[id]/actions.ts`

**`addNote(contactId, prevState, formData)`**
- Fields: body (required, min 1 char)
- Creates `ContactActivity` with type `NOTE`, `createdById` = current session user id
- `revalidatePath('/crm/contactos/' + contactId)`, return `null`

**`updateContact` and `deleteContact`** — imported and re-exported from `app/crm/contactos/actions.ts`. No duplication of logic.

---

## CSV Import

Flujo actual: página `/crm/contactos/importar` con `CsvImporter` (cliente) que envía el archivo al servidor; allí `lib/utils/csv.ts` parsea el CSV (delimitador `,` / `;` / tab, UTF-8 con fallback) y el servicio valida filas e importa. Resultado tipo "Importados: 42, Omitidos: 3". (El diseño original con modal + `FileReader` en cliente quedó sustituido.)

CSV format expected (header row required):
```
nombre,email,telefono,fuente
María García,maria@ejemplo.com,+52551234567,WEBINAR
```

---

## Error Handling

- Duplicate email on create: inline error in modal
- Invalid CSV rows: silently skipped, count reported in result
- Contact not found: `notFound()` triggers Next.js 404 page
- Auth: all server actions call `auth()` and return `{ error: 'No autorizado' }` if no session

---

## Pagination

50 contacts per page. Page component passes `skip: (page-1)*50, take: 50` to Prisma. `ContactsTable` receives total count; shows simple "Anterior / Siguiente" buttons that update `?page=N` in the URL. No complex pagination component needed.
