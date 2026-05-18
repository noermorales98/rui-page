# Kommo CRM Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user submits a published form, automatically create a lead in Kommo CRM with the contact's name, email, phone, and the form slug as a tag.

**Architecture:** New `lib/services/kommo.ts` exposes `buildLeadPayload` (pure, testable) and `createKommoLead` (fetches config from Kommo API on first call, caches in memory, POSTs the lead). `lib/services/forms.ts` is extended to surface `contactData`, `formSlug`, and `formName` in its return type. The API route calls `createKommoLead` in a fire-and-forget try/catch after a successful submit — the user's response is never delayed or blocked by Kommo failures.

**Tech Stack:** TypeScript, Node.js `fetch` (built-in), `node:test` + `node:assert/strict` for unit tests, Next.js API route, Prisma (no changes).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/services/kommo.ts` | Create | Types, config cache, `buildLeadPayload`, `createKommoLead` |
| `lib/services/kommo.test.ts` | Create | Unit tests for `buildLeadPayload` (pure logic only) |
| `lib/services/forms.ts` | Modify lines 472–477, 664–670 | Extend `SubmitFormReport`; add `contactData`, `formSlug`, `formName` to return |
| `app/api/forms/[slug]/submit/route.ts` | Modify lines 1–4, 87–105 | Import `createKommoLead`; fire-and-forget call after successful submit |

---

### Task 1: Create `lib/services/kommo.ts`

**Files:**
- Create: `lib/services/kommo.ts`

- [ ] **Step 1: Create the file with full implementation**

```ts
// lib/services/kommo.ts

export type KommoConfig = {
  pipelineId: number
  statusId: number
  emailFieldId: number | null
  phoneFieldId: number | null
}

export type KommoLeadInput = {
  contactName: string | undefined
  email: string | undefined
  phone: string | undefined
  formSlug: string
  formName: string
}

let configCache: KommoConfig | null = null

async function fetchKommoJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Kommo fetch ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

export async function getKommoConfig(baseUrl: string, token: string): Promise<KommoConfig> {
  if (configCache) return configCache

  type Pipeline = { id: number; _embedded: { statuses: Array<{ id: number }> } }
  type PipelinesResponse = { _embedded: { pipelines: Pipeline[] } }
  const pipelinesData = await fetchKommoJson<PipelinesResponse>(
    `${baseUrl}/api/v4/pipelines`,
    token,
  )
  const pipeline = pipelinesData._embedded.pipelines[0]
  if (!pipeline) throw new Error('Kommo: no pipelines found')
  const pipelineId = pipeline.id
  const statusId = pipeline._embedded.statuses[0]?.id
  if (!statusId) throw new Error('Kommo: no statuses in pipeline')

  type CustomField = { id: number; field_code?: string; field_type?: string }
  type FieldsResponse = { _embedded: { custom_fields: CustomField[] } }
  const fieldsData = await fetchKommoJson<FieldsResponse>(
    `${baseUrl}/api/v4/contacts/custom_fields`,
    token,
  )
  const fields = fieldsData._embedded.custom_fields
  const emailField = fields.find((f) => f.field_code === 'EMAIL' || f.field_type === 'EMAIL')
  const phoneField = fields.find((f) => f.field_code === 'PHONE' || f.field_type === 'PHONE')

  configCache = {
    pipelineId,
    statusId,
    emailFieldId: emailField?.id ?? null,
    phoneFieldId: phoneField?.id ?? null,
  }
  return configCache
}

export function buildLeadPayload(input: KommoLeadInput, config: KommoConfig): object[] {
  const name = input.contactName ?? 'Sin nombre'
  const customFields: Array<{
    field_id: number
    values: Array<{ value: string; enum_code: string }>
  }> = []

  if (config.emailFieldId && input.email) {
    customFields.push({
      field_id: config.emailFieldId,
      values: [{ value: input.email, enum_code: 'WORK' }],
    })
  }
  if (config.phoneFieldId && input.phone) {
    customFields.push({
      field_id: config.phoneFieldId,
      values: [{ value: input.phone, enum_code: 'WORK' }],
    })
  }

  return [
    {
      name: `Form: ${input.formName} — ${name}`,
      pipeline_id: config.pipelineId,
      status_id: config.statusId,
      _embedded: {
        contacts: [{ name, custom_fields_values: customFields }],
        tags: [{ name: input.formSlug }],
      },
    },
  ]
}

export async function createKommoLead(input: KommoLeadInput): Promise<void> {
  const baseUrl = process.env.KOMMO_BASE_URL
  const token = process.env.KOMMO_LONG_TOKEN
  if (!baseUrl || !token) return

  const config = await getKommoConfig(baseUrl, token)
  const payload = buildLeadPayload(input, config)

  const res = await fetch(`${baseUrl}/api/v4/leads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Kommo API ${res.status}`)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/services/kommo.ts
git commit -m "feat: add Kommo service with lead creation and in-memory config cache"
```

---

### Task 2: Write unit tests for `buildLeadPayload`

**Files:**
- Create: `lib/services/kommo.test.ts`

- [ ] **Step 1: Write the test file**

```ts
// lib/services/kommo.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLeadPayload, type KommoConfig, type KommoLeadInput } from './kommo'

const BASE_CONFIG: KommoConfig = {
  pipelineId: 1,
  statusId: 10,
  emailFieldId: 100,
  phoneFieldId: 200,
}

test('includes email and phone when field_ids and values exist', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: 'ana@test.com',
    phone: '+521234567890',
    formSlug: 'contacto',
    formName: 'Formulario de Contacto',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    _embedded: { contacts: Array<{ custom_fields_values: Array<{ field_id: number; values: Array<{ value: string }> }> }> }
  }>
  const fields = lead._embedded.contacts[0].custom_fields_values
  assert.equal(fields.length, 2)
  assert.equal(fields[0].field_id, 100)
  assert.equal(fields[0].values[0].value, 'ana@test.com')
  assert.equal(fields[1].field_id, 200)
  assert.equal(fields[1].values[0].value, '+521234567890')
})

test('omits email when emailFieldId is null', () => {
  const config: KommoConfig = { ...BASE_CONFIG, emailFieldId: null }
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: 'ana@test.com',
    phone: undefined,
    formSlug: 'f',
    formName: 'F',
  }
  const [lead] = buildLeadPayload(input, config) as Array<{
    _embedded: { contacts: Array<{ custom_fields_values: unknown[] }> }
  }>
  assert.equal(lead._embedded.contacts[0].custom_fields_values.length, 0)
})

test('omits phone when phone is undefined', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: 'ana@test.com',
    phone: undefined,
    formSlug: 'f',
    formName: 'F',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    _embedded: { contacts: Array<{ custom_fields_values: Array<{ field_id: number }> }> }
  }>
  const fields = lead._embedded.contacts[0].custom_fields_values
  assert.equal(fields.length, 1)
  assert.equal(fields[0].field_id, 100)
})

test('uses "Sin nombre" when contactName is undefined', () => {
  const input: KommoLeadInput = {
    contactName: undefined,
    email: 'x@x.com',
    phone: undefined,
    formSlug: 'f',
    formName: 'F',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    name: string
    _embedded: { contacts: Array<{ name: string }> }
  }>
  assert.equal(lead._embedded.contacts[0].name, 'Sin nombre')
  assert.ok(lead.name.includes('Sin nombre'))
})

test('puts formSlug as tag', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: undefined,
    phone: undefined,
    formSlug: 'mi-form',
    formName: 'Mi Formulario',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    _embedded: { tags: Array<{ name: string }> }
  }>
  assert.equal(lead._embedded.tags[0].name, 'mi-form')
})

test('lead name follows "Form: [formName] — [contactName]" pattern', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: undefined,
    phone: undefined,
    formSlug: 'f',
    formName: 'Mi Formulario',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{ name: string }>
  assert.equal(lead.name, 'Form: Mi Formulario — Ana')
})
```

- [ ] **Step 2: Run tests — expect all 6 to pass**

```bash
npx tsx --test lib/services/kommo.test.ts
```

Expected output:
```
✔ includes email and phone when field_ids and values exist
✔ omits email when emailFieldId is null
✔ omits phone when phone is undefined
✔ uses "Sin nombre" when contactName is undefined
✔ puts formSlug as tag
✔ lead name follows "Form: [formName] — [contactName]" pattern
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

- [ ] **Step 3: Commit**

```bash
git add lib/services/kommo.test.ts
git commit -m "test: add unit tests for buildLeadPayload"
```

---

### Task 3: Extend `SubmitFormReport` in `lib/services/forms.ts`

**Files:**
- Modify: `lib/services/forms.ts` (lines 472–477 and 664–670)

Two changes: extend the type, extend the return.

- [ ] **Step 1: Extend the `SubmitFormReport` type (line 472)**

Replace:
```ts
export type SubmitFormReport = {
  submissionId: number
  contactId: number | null
  contactCreated: boolean
  successMessage: string
}
```

With:
```ts
export type SubmitFormReport = {
  submissionId: number
  contactId: number | null
  contactCreated: boolean
  successMessage: string
  contactData: { name?: string; email?: string; phone?: string }
  formSlug: string
  formName: string
}
```

- [ ] **Step 2: Extend the return statement (around line 664)**

Replace:
```ts
    return {
      ok: true,
      data: {
        ...result,
        successMessage: form.successMessage,
      },
    }
```

With:
```ts
    return {
      ok: true,
      data: {
        ...result,
        successMessage: form.successMessage,
        contactData,
        formSlug: slug,
        formName: form.name,
      },
    }
```

Note: `contactData` is declared at line 545 as `const contactData: { name?: string; email?: string; phone?: string } = {}` and is in scope here. `slug` is the function parameter. `form.name` is already selected in the Prisma query.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. If any caller of `submitForm` destructures the result and TypeScript now complains about missing fields, that's expected — they will still work at runtime since the new fields are additions only.

- [ ] **Step 4: Commit**

```bash
git add lib/services/forms.ts
git commit -m "feat: expose contactData, formSlug, formName in SubmitFormReport"
```

---

### Task 4: Wire `createKommoLead` into the form submit API route

**Files:**
- Modify: `app/api/forms/[slug]/submit/route.ts` (lines 1–4 and 87–96)

- [ ] **Step 1: Add the import at the top of the file**

The current imports are:
```ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { hashIpForSubmit, submitForm } from '@/lib/services/forms'
import { checkRateLimit } from '@/lib/ratelimit/memory'
```

Add one line after the existing imports:
```ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { hashIpForSubmit, submitForm } from '@/lib/services/forms'
import { checkRateLimit } from '@/lib/ratelimit/memory'
import { createKommoLead } from '@/lib/services/kommo'
```

- [ ] **Step 2: Add the fire-and-forget Kommo call**

After the line `const result = await submitForm(slug, values, { ipHash, userAgent })` (currently line 87), add:

```ts
  const result = await submitForm(slug, values, { ipHash, userAgent })

  if (result.ok) {
    void createKommoLead({
      contactName: result.data.contactData.name,
      email: result.data.contactData.email,
      phone: result.data.contactData.phone,
      formSlug: result.data.formSlug,
      formName: result.data.formName,
    }).catch((err: unknown) => console.error('[Kommo] createKommoLead failed:', err))
  }

  if (!result.ok) {
```

The existing `if (!result.ok)` block stays unchanged below.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/forms/[slug]/submit/route.ts
git commit -m "feat: send lead to Kommo on form submission (non-blocking)"
```

---

### Task 5: Add `KOMMO_BASE_URL` to environment

**Files:**
- Modify: `.env.example` (or `.env.local` for local testing)

- [ ] **Step 1: Add missing env var to `.env.example`**

Open `.env.example`. Find the section where other external service variables are declared. Add:

```
KOMMO_BASE_URL=https://yoursubdomain.kommo.com
KOMMO_LONG_TOKEN=
```

`KOMMO_ID` and `KOMMO_SECRET_KEY` may already be present (user confirmed they have them). If they are, leave them. Only add the two new ones if missing.

- [ ] **Step 2: Add to your local `.env.local` for development testing**

```
KOMMO_BASE_URL=https://ruimachalele.kommo.com
KOMMO_LONG_TOKEN=<your long-lived token>
```

Do NOT commit `.env.local` or `.env` — they are gitignored.

- [ ] **Step 3: Commit `.env.example` only**

```bash
git add .env.example
git commit -m "chore: add KOMMO_BASE_URL and KOMMO_LONG_TOKEN to env.example"
```

---

## Verification

After all tasks are complete:

1. Start the dev server: `npm run dev`
2. Submit a form with name, email, and phone via `POST /api/forms/[slug]/submit`
3. Check the Kommo CRM dashboard at `https://ruimachalele.kommo.com` — a new lead should appear with the contact embedded, email/phone in custom fields, and the form slug as a tag
4. If `KOMMO_BASE_URL` is not set, submit a form and verify the response is still `200 ok` (Kommo is skipped silently)
5. Check server logs for `[Kommo]` prefix if something goes wrong
