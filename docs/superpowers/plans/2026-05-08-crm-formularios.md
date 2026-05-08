# CRM Formularios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/crm/formularios` so CRM users can create forms, configure custom fields, publish a public form URL, and capture submissions into optimized MySQL tables plus CRM contacts.

**Architecture:** Use normalized Prisma models for form definitions, fields, submissions, and per-field values. Keep `/crm/formularios` authenticated through the existing CRM layout and actions. Render published forms at `/formularios/[slug]` without CRM auth, using a shared renderer and custom date/time inputs that do not rely on native HTML date/time controls.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7 + MariaDB, NextAuth v5, Zod, Tailwind CSS v4, Lucide React.

---

## Key Constraints

- Read local Next docs before code changes. Relevant docs already identified:
  - `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
  - `node_modules/next/dist/docs/01-app/02-guides/forms.md`
- `params` and `searchParams` are promises in this Next version and must be awaited.
- All private mutations must call `auth()` inside the Server Action.
- Server Actions in `'use server'` files should export async functions only.
- Do not use `input type="date"`, `input type="time"` or `input type="datetime-local"` for Fecha, Hora or Fecha y hora.
- Keep existing uncommitted user changes intact.
- No test framework is configured. Verify with `npm run build`, `npm run lint`, and browser checks.

## File Map

Create:

- `app/_components/forms/CustomTemporalInputs.tsx` - reusable custom date/time/datetime controls
- `app/_components/forms/FormRenderer.tsx` - public/preview renderer for form fields
- `app/crm/formularios/actions.ts` - authenticated CRUD actions for forms and fields
- `app/crm/formularios/_lib/field-types.ts` - field templates, validators and normalizers
- `app/crm/formularios/_components/CreateFormModal.tsx` - create form modal
- `app/crm/formularios/_components/FormulariosTable.tsx` - CRM list table
- `app/crm/formularios/_components/FormBuilder.tsx` - builder shell
- `app/crm/formularios/_components/FieldPalette.tsx` - default input palette
- `app/crm/formularios/_components/FieldEditor.tsx` - selected field editor
- `app/crm/formularios/_components/FieldPreviewCard.tsx` - editable preview row
- `app/crm/formularios/[id]/page.tsx` - form builder page
- `app/crm/formularios/[id]/respuestas/page.tsx` - submissions list page
- `app/formularios/[slug]/page.tsx` - public published form page
- `app/formularios/[slug]/actions.ts` - public submission action

Modify:

- `prisma/schema.prisma` - add form models, enums, relations and `FORM_SUBMITTED`
- `app/crm/formularios/page.tsx` - replace placeholder with real list

## Task 1: Schema And Database

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `FORM_SUBMITTED` to `ActivityType`**

Update the enum so form submissions can appear in contact history:

```prisma
enum ActivityType {
  NOTE
  EMAIL_SENT
  WEBINAR_REGISTERED
  WEBINAR_ATTENDED
  COURSE_PURCHASED
  FORM_SUBMITTED
}
```

- [ ] **Step 2: Add relations to existing models**

Add to `User`:

```prisma
  forms      CrmForm[]
```

Add to `Contact`:

```prisma
  formSubmissions CrmFormSubmission[]
```

- [ ] **Step 3: Add form enums and models**

Place these after the existing CRM models:

```prisma
enum CrmFormStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CrmFormFieldType {
  SHORT_TEXT
  FULL_NAME
  PHONE
  PHONE_WITH_COUNTRY
  EMAIL
  CUSTOM_DATE
  CUSTOM_TIME
  CUSTOM_DATETIME
}

enum CrmFormContactTarget {
  NONE
  NAME
  EMAIL
  PHONE
}

model CrmForm {
  id             Int                 @id @default(autoincrement())
  name           String
  slug           String              @unique @db.VarChar(191)
  status         CrmFormStatus       @default(DRAFT)
  description    String?             @db.Text
  submitLabel    String              @default("Enviar")
  successMessage String              @default("Gracias, recibimos tus datos.")
  createdById    Int?
  createdBy      User?               @relation(fields: [createdById], references: [id], onDelete: SetNull)
  fields         CrmFormField[]
  submissions    CrmFormSubmission[]
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  @@index([createdById])
  @@index([status, updatedAt])
}

model CrmFormField {
  id            Int                  @id @default(autoincrement())
  formId        Int
  form          CrmForm              @relation(fields: [formId], references: [id], onDelete: Cascade)
  type          CrmFormFieldType
  contactTarget CrmFormContactTarget @default(NONE)
  label         String
  fieldKey      String               @db.VarChar(191)
  placeholder   String?
  helpText      String?              @db.Text
  isRequired    Boolean              @default(false)
  position      Int                  @default(0)
  config        Json?
  values        CrmFormSubmissionValue[]
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  @@unique([formId, fieldKey])
  @@index([formId, position])
}

model CrmFormSubmission {
  id          Int                      @id @default(autoincrement())
  formId      Int
  form        CrmForm                  @relation(fields: [formId], references: [id], onDelete: Cascade)
  contactId   Int?
  contact     Contact?                 @relation(fields: [contactId], references: [id], onDelete: SetNull)
  submittedAt DateTime                 @default(now())
  ipHash      String?
  userAgent   String?                  @db.Text
  values      CrmFormSubmissionValue[]

  @@index([formId, submittedAt])
  @@index([contactId])
}

model CrmFormSubmissionValue {
  id              Int               @id @default(autoincrement())
  submissionId    Int
  submission      CrmFormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  fieldId         Int
  field           CrmFormField      @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  rawValue        String?           @db.Text
  normalizedValue String?           @db.VarChar(191)

  @@unique([submissionId, fieldId])
  @@index([fieldId, normalizedValue])
}
```

- [ ] **Step 4: Push schema and generate client**

Run:

```bash
npx prisma db push
npx prisma generate
```

Expected:

- Database sync completes.
- Prisma Client is generated without schema errors.

- [ ] **Step 5: Verify importable enums**

Run:

```bash
node -e "const { CrmFormFieldType, CrmFormStatus } = require('@prisma/client'); console.log(Object.keys(CrmFormFieldType)); console.log(Object.keys(CrmFormStatus))"
```

Expected output includes:

```text
[ 'SHORT_TEXT', 'FULL_NAME', 'PHONE', 'PHONE_WITH_COUNTRY', 'EMAIL', 'CUSTOM_DATE', 'CUSTOM_TIME', 'CUSTOM_DATETIME' ]
[ 'DRAFT', 'PUBLISHED', 'ARCHIVED' ]
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(forms): add CRM form schema"
```

## Task 2: Field Templates And Validation Library

**Files:**

- Create: `app/crm/formularios/_lib/field-types.ts`

- [ ] **Step 1: Create field metadata**

Create the file with these exports:

```ts
import type { CrmFormContactTarget, CrmFormFieldType } from '@prisma/client'

export type FieldTemplate = {
  type: CrmFormFieldType
  label: string
  fieldKey: string
  placeholder: string
  contactTarget: CrmFormContactTarget
  isRequired: boolean
}

export const DEFAULT_FIELD_TEMPLATES: FieldTemplate[] = [
  {
    type: 'SHORT_TEXT',
    label: 'Nombre',
    fieldKey: 'nombre',
    placeholder: 'Tu nombre',
    contactTarget: 'NAME',
    isRequired: true,
  },
  {
    type: 'FULL_NAME',
    label: 'Nombre completo',
    fieldKey: 'nombre_completo',
    placeholder: 'Nombre y apellidos',
    contactTarget: 'NAME',
    isRequired: false,
  },
  {
    type: 'PHONE',
    label: 'Telefono',
    fieldKey: 'telefono',
    placeholder: '555 123 4567',
    contactTarget: 'PHONE',
    isRequired: false,
  },
  {
    type: 'PHONE_WITH_COUNTRY',
    label: 'Telefono con lada',
    fieldKey: 'telefono_con_lada',
    placeholder: '+52 555 123 4567',
    contactTarget: 'PHONE',
    isRequired: false,
  },
  {
    type: 'EMAIL',
    label: 'Correo',
    fieldKey: 'correo',
    placeholder: 'tu@correo.com',
    contactTarget: 'EMAIL',
    isRequired: true,
  },
  {
    type: 'CUSTOM_DATE',
    label: 'Fecha',
    fieldKey: 'fecha',
    placeholder: 'Selecciona una fecha',
    contactTarget: 'NONE',
    isRequired: false,
  },
  {
    type: 'CUSTOM_TIME',
    label: 'Hora',
    fieldKey: 'hora',
    placeholder: 'Selecciona una hora',
    contactTarget: 'NONE',
    isRequired: false,
  },
  {
    type: 'CUSTOM_DATETIME',
    label: 'Fecha y hora',
    fieldKey: 'fecha_y_hora',
    placeholder: 'Selecciona fecha y hora',
    contactTarget: 'NONE',
    isRequired: false,
  },
]

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
}

export function normalizeValue(type: CrmFormFieldType, rawValue: string) {
  const value = rawValue.trim()

  if (type === 'EMAIL') return value.toLowerCase()
  if (type === 'PHONE' || type === 'PHONE_WITH_COUNTRY') return value.replace(/[^\d+]/g, '')
  if (type === 'CUSTOM_DATE' || type === 'CUSTOM_TIME' || type === 'CUSTOM_DATETIME') return value

  return value.slice(0, 191)
}

export function validateFieldValue(type: CrmFormFieldType, rawValue: string, isRequired: boolean) {
  const value = rawValue.trim()

  if (isRequired && !value) return 'Este campo es obligatorio'
  if (!value) return null

  if (type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Correo invalido'
  }

  if ((type === 'PHONE' || type === 'PHONE_WITH_COUNTRY') && normalizeValue(type, value).length < 7) {
    return 'Telefono invalido'
  }

  if (type === 'CUSTOM_DATE' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Fecha invalida'
  }

  if (type === 'CUSTOM_TIME' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return 'Hora invalida'
  }

  if (type === 'CUSTOM_DATETIME' && !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return 'Fecha y hora invalida'
  }

  return null
}
```

- [ ] **Step 2: Type-check**

Run:

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add app/crm/formularios/_lib/field-types.ts
git commit -m "feat(forms): add field templates and validators"
```

## Task 3: Authenticated Form Actions

**Files:**

- Create: `app/crm/formularios/actions.ts`

- [ ] **Step 1: Create server actions**

Create actions with these exported async functions:

```ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { DEFAULT_FIELD_TEMPLATES, slugify } from './_lib/field-types'
import type { CrmFormFieldType } from '@prisma/client'

type ActionState = { error: string } | null

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  submitLabel: z.string().min(1, 'El texto del boton es obligatorio'),
  successMessage: z.string().min(1, 'El mensaje de exito es obligatorio'),
})

const fieldSchema = z.object({
  type: z.enum([
    'SHORT_TEXT',
    'FULL_NAME',
    'PHONE',
    'PHONE_WITH_COUNTRY',
    'EMAIL',
    'CUSTOM_DATE',
    'CUSTOM_TIME',
    'CUSTOM_DATETIME',
  ]),
  label: z.string().min(1, 'La etiqueta es obligatoria'),
  fieldKey: z.string().min(1, 'La clave interna es obligatoria'),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isRequired: z.coerce.boolean().default(false),
  contactTarget: z.enum(['NONE', 'NAME', 'EMAIL', 'PHONE']).default('NONE'),
})

async function requireSession() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

export async function createForm(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const name = (formData.get('name') as string)?.trim()
  const slug = slugify((formData.get('slug') as string) || name)

  const parsed = formSchema.safeParse({
    name,
    slug,
    description: (formData.get('description') as string) || undefined,
    submitLabel: (formData.get('submitLabel') as string) || 'Enviar',
    successMessage: (formData.get('successMessage') as string) || 'Gracias, recibimos tus datos.',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  try {
    await prisma.crmForm.create({
      data: {
        ...parsed.data,
        createdById: Number(session.user.id),
        fields: {
          create: DEFAULT_FIELD_TEMPLATES.map((field, index) => ({
            type: field.type,
            label: field.label,
            fieldKey: field.fieldKey,
            placeholder: field.placeholder,
            contactTarget: field.contactTarget,
            isRequired: field.isRequired,
            position: index,
          })),
        },
      },
    })
  } catch (err: unknown) {
    if (err !== null && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'Ya existe un formulario con ese slug' }
    }
    return { error: 'Error al crear el formulario' }
  }

  revalidatePath('/crm/formularios')
  return null
}

export async function updateFormSettings(
  formId: number,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = formSchema.safeParse({
    name: formData.get('name'),
    slug: slugify((formData.get('slug') as string) || ''),
    description: (formData.get('description') as string) || undefined,
    submitLabel: (formData.get('submitLabel') as string) || 'Enviar',
    successMessage: (formData.get('successMessage') as string) || 'Gracias, recibimos tus datos.',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  try {
    await prisma.crmForm.update({ where: { id: formId }, data: parsed.data })
  } catch (err: unknown) {
    if (err !== null && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'Ya existe un formulario con ese slug' }
    }
    return { error: 'Error al actualizar el formulario' }
  }

  revalidatePath('/crm/formularios')
  revalidatePath(`/crm/formularios/${formId}`)
  return null
}

export async function addField(formId: number, type: CrmFormFieldType): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const template = DEFAULT_FIELD_TEMPLATES.find((field) => field.type === type)
  if (!template) return { error: 'Tipo de campo invalido' }

  const count = await prisma.crmFormField.count({ where: { formId } })
  const fieldKey = `${template.fieldKey}_${count + 1}`

  await prisma.crmFormField.create({
    data: {
      formId,
      type: template.type,
      label: template.label,
      fieldKey,
      placeholder: template.placeholder,
      isRequired: template.isRequired,
      contactTarget: template.contactTarget,
      position: count,
    },
  })

  revalidatePath(`/crm/formularios/${formId}`)
  return {}
}

export async function updateField(
  fieldId: number,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = fieldSchema.safeParse({
    type: formData.get('type'),
    label: formData.get('label'),
    fieldKey: slugify((formData.get('fieldKey') as string) || ''),
    placeholder: (formData.get('placeholder') as string) || undefined,
    helpText: (formData.get('helpText') as string) || undefined,
    isRequired: formData.get('isRequired') === 'on',
    contactTarget: (formData.get('contactTarget') as string) || 'NONE',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  const field = await prisma.crmFormField.update({
    where: { id: fieldId },
    data: parsed.data,
    select: { formId: true },
  })

  revalidatePath(`/crm/formularios/${field.formId}`)
  return null
}

export async function deleteField(fieldId: number): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const field = await prisma.crmFormField.delete({
    where: { id: fieldId },
    select: { formId: true },
  })

  revalidatePath(`/crm/formularios/${field.formId}`)
  return {}
}

export async function moveField(fieldId: number, direction: 'up' | 'down'): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const current = await prisma.crmFormField.findUnique({ where: { id: fieldId } })
  if (!current) return { error: 'Campo no encontrado' }

  const sibling = await prisma.crmFormField.findFirst({
    where: {
      formId: current.formId,
      position: direction === 'up' ? { lt: current.position } : { gt: current.position },
    },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  })

  if (!sibling) return {}

  await prisma.$transaction([
    prisma.crmFormField.update({ where: { id: current.id }, data: { position: sibling.position } }),
    prisma.crmFormField.update({ where: { id: sibling.id }, data: { position: current.position } }),
  ])

  revalidatePath(`/crm/formularios/${current.formId}`)
  return {}
}

export async function setFormStatus(formId: number, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  await prisma.crmForm.update({ where: { id: formId }, data: { status } })
  revalidatePath('/crm/formularios')
  revalidatePath(`/crm/formularios/${formId}`)
  return {}
}
```

- [ ] **Step 2: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/crm/formularios/actions.ts
git commit -m "feat(forms): add authenticated form actions"
```

## Task 4: CRM Forms List

**Files:**

- Modify: `app/crm/formularios/page.tsx`
- Create: `app/crm/formularios/_components/CreateFormModal.tsx`
- Create: `app/crm/formularios/_components/FormulariosTable.tsx`

- [ ] **Step 1: Replace placeholder page**

Fetch forms with `_count` and latest submission:

```ts
import { prisma } from '@/lib/prisma'
import { CreateFormModal } from './_components/CreateFormModal'
import { FormulariosTable } from './_components/FormulariosTable'

export default async function FormulariosPage() {
  const forms = await prisma.crmForm.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      _count: { select: { fields: true, submissions: true } },
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: { submittedAt: true },
      },
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formularios</h1>
          <p className="mt-1 text-sm text-gray-500">Crea formularios y captura leads al CRM.</p>
        </div>
        <CreateFormModal />
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <FormulariosTable forms={forms} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create modal**

`CreateFormModal` must be a client component using `useActionState(createForm, null)`, with fields:

- `name`
- `slug`
- `description`
- `submitLabel`
- `successMessage`

On success, close the modal and reset local submitted state.

- [ ] **Step 3: Create table**

`FormulariosTable` must render:

- Nombre linking to `/crm/formularios/[id]`
- Estado badge
- Public URL `/formularios/[slug]`
- Campos count
- Respuestas count linking to `/crm/formularios/[id]/respuestas`
- Ultima respuesta
- Actions: editar, publicar/borrador, archivar

- [ ] **Step 4: Verify**

Run:

```bash
npm run build
```

Expected: list page compiles and no missing imports.

- [ ] **Step 5: Commit**

```bash
git add app/crm/formularios/page.tsx app/crm/formularios/_components/CreateFormModal.tsx app/crm/formularios/_components/FormulariosTable.tsx
git commit -m "feat(forms): add CRM forms list"
```

## Task 5: Builder Page

**Files:**

- Create: `app/crm/formularios/[id]/page.tsx`
- Create: `app/crm/formularios/_components/FormBuilder.tsx`
- Create: `app/crm/formularios/_components/FieldPalette.tsx`
- Create: `app/crm/formularios/_components/FieldEditor.tsx`
- Create: `app/crm/formularios/_components/FieldPreviewCard.tsx`

- [ ] **Step 1: Create builder route**

The server page must:

- Await `params`
- Parse numeric id
- Fetch form with ordered fields
- Call `notFound()` when id is invalid or missing
- Pass data to `FormBuilder`

Query:

```ts
const form = await prisma.crmForm.findUnique({
  where: { id: formId },
  include: {
    fields: { orderBy: { position: 'asc' } },
    _count: { select: { submissions: true } },
  },
})
```

- [ ] **Step 2: Create builder layout**

`FormBuilder` should be a client component with:

- Header with back link, form name, status, public URL
- Left panel: `FieldPalette`
- Center panel: ordered preview with `FieldPreviewCard`
- Right panel: `FieldEditor` for selected field plus form settings

- [ ] **Step 3: Create palette**

`FieldPalette` renders all `DEFAULT_FIELD_TEMPLATES` as buttons with icons:

- Text icon for Nombre and Nombre completo
- Phone icon for Telefono and Telefono con lada
- Mail icon for Correo
- Calendar icon for Fecha
- Clock icon for Hora
- CalendarClock icon for Fecha y hora

Click calls `addField(formId, template.type)`.

- [ ] **Step 4: Create field editor**

`FieldEditor` uses `useActionState(updateField.bind(null, field.id), null)` and edits:

- `label`
- `fieldKey`
- `placeholder`
- `helpText`
- `isRequired`
- `contactTarget`

Render hidden `type` input with the current type.

- [ ] **Step 5: Create preview card**

`FieldPreviewCard` shows label, type, required badge, help text, and buttons:

- Move up
- Move down
- Delete

Use `moveField(field.id, 'up')`, `moveField(field.id, 'down')`, and `deleteField(field.id)`.

- [ ] **Step 6: Verify**

Run:

```bash
npm run build
```

Expected: builder route compiles.

- [ ] **Step 7: Commit**

```bash
git add app/crm/formularios/[id]/page.tsx app/crm/formularios/_components/FormBuilder.tsx app/crm/formularios/_components/FieldPalette.tsx app/crm/formularios/_components/FieldEditor.tsx app/crm/formularios/_components/FieldPreviewCard.tsx
git commit -m "feat(forms): add form builder"
```

## Task 6: Custom Temporal Inputs And Shared Renderer

**Files:**

- Create: `app/_components/forms/CustomTemporalInputs.tsx`
- Create: `app/_components/forms/FormRenderer.tsx`

- [ ] **Step 1: Create temporal controls**

`CustomTemporalInputs.tsx` must start with `'use client'` and export:

- `CustomDateInput`
- `CustomTimeInput`
- `CustomDateTimeInput`

Rules:

- Visible controls use buttons, lists, and text labels.
- The submitted value is placed in `<input type="hidden" name={name} value={value} />`.
- No `type="date"`, no `type="time"`, no `type="datetime-local"`.
- Date value format is `YYYY-MM-DD`.
- Time value format is `HH:mm`.
- Datetime value format is `YYYY-MM-DDTHH:mm`.

- [ ] **Step 2: Create renderer**

`FormRenderer.tsx` receives:

```ts
type RenderField = {
  id: number
  fieldKey: string
  type: CrmFormFieldType
  label: string
  placeholder: string | null
  helpText: string | null
  isRequired: boolean
}
```

It renders:

- `SHORT_TEXT` and `FULL_NAME` as `input type="text"`
- `PHONE` and `PHONE_WITH_COUNTRY` as `input type="tel"`
- `EMAIL` as `input type="email"`
- `CUSTOM_DATE` as `CustomDateInput`
- `CUSTOM_TIME` as `CustomTimeInput`
- `CUSTOM_DATETIME` as `CustomDateTimeInput`

- [ ] **Step 3: Static scan**

Run:

```bash
rg -n "type=\"date\"|type=\"time\"|type=\"datetime-local\"" app/_components/forms app/crm/formularios app/formularios
```

Expected: no output for the new forms module.

- [ ] **Step 4: Build**

Run:

```bash
npm run build
```

Expected: renderer compiles.

- [ ] **Step 5: Commit**

```bash
git add app/_components/forms/CustomTemporalInputs.tsx app/_components/forms/FormRenderer.tsx
git commit -m "feat(forms): add custom form renderer inputs"
```

## Task 7: Public Form Submission

**Files:**

- Create: `app/formularios/[slug]/page.tsx`
- Create: `app/formularios/[slug]/actions.ts`

- [ ] **Step 1: Create public page**

The page must:

- Await `params`
- Fetch form by slug
- Require `status: 'PUBLISHED'`
- Include ordered fields
- Render `FormRenderer`
- Show `notFound()` for missing, draft or archived forms

- [ ] **Step 2: Create submission action**

The action must:

- Load the published form with fields
- Validate required fields and per-type formats using `validateFieldValue`
- Normalize values using `normalizeValue`
- Identify contact data from `contactTarget`
- Use a transaction
- Create or update `Contact` with `source: 'FORM'`
- Create `CrmFormSubmission`
- Create `CrmFormSubmissionValue[]`
- Create `ContactActivity` with `type: 'FORM_SUBMITTED'` when contact exists
- Return `{ error: string } | null` for validation failures

Important contact rule:

- If a contact already exists, fill missing `phone` only when current phone is null.
- Do not overwrite manually edited contact name unless the existing name is empty.

- [ ] **Step 3: Revalidation**

On successful submission, revalidate:

- `/crm/formularios`
- `/crm/formularios/[id]`
- `/crm/formularios/[id]/respuestas`
- `/crm/contactos`

- [ ] **Step 4: Build**

Run:

```bash
npm run build
```

Expected: public route compiles.

- [ ] **Step 5: Commit**

```bash
git add app/formularios/[slug]/page.tsx app/formularios/[slug]/actions.ts
git commit -m "feat(forms): add public form submissions"
```

## Task 8: Responses Page

**Files:**

- Create: `app/crm/formularios/[id]/respuestas/page.tsx`

- [ ] **Step 1: Create paginated responses page**

Use `PAGE_SIZE = 50`. Fetch:

- Form metadata
- Fields ordered by position
- Submissions ordered by `submittedAt desc`
- Values for each submission
- Contact id, name and email when present

Render table:

- Submitted date
- Contact link when available
- One column per form field
- Empty state when no submissions exist
- Pagination controls preserving `?page=`

- [ ] **Step 2: Optimize query shape**

Use `select` for fields and values. Avoid including entire `Contact`, `CrmForm` or nested models that are not displayed.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: responses page compiles.

- [ ] **Step 4: Commit**

```bash
git add app/crm/formularios/[id]/respuestas/page.tsx
git commit -m "feat(forms): add form responses page"
```

## Task 9: Verification

- [ ] **Step 1: Lint**

Run:

```bash
npm run lint
```

Expected: no ESLint errors.

- [ ] **Step 2: Production build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Static temporal input check**

Run:

```bash
rg -n "type=\"date\"|type=\"time\"|type=\"datetime-local\"" app/_components/forms app/crm/formularios app/formularios
```

Expected: no output.

- [ ] **Step 4: Manual browser checks**

Start dev server:

```bash
npm run dev
```

Check:

- `/crm/formularios` requires login.
- Creating a form inserts default fields.
- Builder can add, edit, move and delete fields.
- Publishing makes `/formularios/[slug]` available.
- Draft and archived forms return 404 publicly.
- Public submission creates `CrmFormSubmission`.
- Public submission with email creates or links `Contact`.
- Contact activity shows a form submission event.
- Fecha, Hora and Fecha y hora are usable without native browser controls.

- [ ] **Step 5: Commit final fixes**

```bash
git status --short
git add app prisma
git commit -m "feat(forms): complete CRM forms module"
```
