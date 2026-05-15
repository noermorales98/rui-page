# Form Block Dinámico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el formulario genérico hardcodeado del bloque FORM con un selector de CrmForms reales — cada bloque FORM puede vincular un formulario distinto, el canvas muestra los campos reales en tiempo real, y la landing pública renderiza el formulario funcional.

**Architecture:** El config del bloque FORM pasa a almacenar `{ formId, formSlug }`. `FormEditor` carga la lista de forms publicados vía server action y permite seleccionarlos. `LandingBuilder` mantiene un `formsCache` con los datos de cada form seleccionado (fields, labels, etc.) y lo pasa al canvas para preview WYSIWYG. La landing pública (server component) hace query a BD, construye un mapa de `formElements` con componentes `CrmFormEmbed` funcionales y los pasa a `renderFunnelBlocks`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, server actions, `node:test`.

---

## File Map

| Acción | Ruta |
|--------|------|
| Modify | `lib/funnels/types.ts` — añadir `FormCacheEntry` |
| Modify | `lib/funnels/defaults.ts` — actualizar FORM default config |
| Modify | `lib/funnels/builder-validation.ts` — añadir regla FORM |
| Modify | `lib/funnels/builder-validation.test.ts` — 2 tests nuevos |
| Modify | `lib/funnels/render.ts` — aceptar `formsCache` + `formElements`, renderizar form real |
| Modify | `app/crm/landings/actions.ts` — añadir `listPublishedFormsAction`, `getFormDetailAction` |
| Modify | `app/crm/landings/_components/builder/editors/FormEditor.tsx` — reemplazar con selector |
| Modify | `app/crm/landings/_components/LandingBuilder.tsx` — añadir `formsCache` state |
| Modify | `app/crm/landings/_components/builder/BuilderCanvas.tsx` — pasar `formsCache` al renderer |
| Create | `app/f/[slug]/[[...page]]/_components/CrmFormEmbed.tsx` — form funcional para public page |
| Modify | `app/f/[slug]/[[...page]]/page.tsx` — fetch forms, pasar `formElements` a renderer |

---

### Task 1: Tipo `FormCacheEntry` + default FORM + validación

**Files:**
- Modify: `lib/funnels/types.ts`
- Modify: `lib/funnels/defaults.ts`
- Modify: `lib/funnels/builder-validation.ts`
- Modify: `lib/funnels/builder-validation.test.ts`

- [ ] **Step 1: Añadir `FormCacheEntry` al final de `lib/funnels/types.ts`**

```ts
export type FormCacheEntry = {
  id: number
  name: string
  slug: string
  submitLabel: string
  successMessage: string
  fields: {
    id: number
    label: string
    fieldKey: string
    type: string
    placeholder: string | null
    isRequired: boolean
  }[]
}
```

- [ ] **Step 2: Actualizar FORM default config en `lib/funnels/defaults.ts` línea 98**

Reemplazar:
```ts
FORM:         { title: 'Reserva tu lugar', submitLabel: 'Reservar mi lugar' },
```
con:
```ts
FORM:         { title: '', formId: null, formSlug: null },
```

- [ ] **Step 3: Añadir tests que fallarán en `lib/funnels/builder-validation.test.ts`**

Al final del archivo, añadir:
```ts
test('validateBlocks flags FORM without formId', () => {
  const errors = validateBlocks([block('FORM', { title: '', formId: null, formSlug: null })])
  assert.equal(errors.length, 1)
  assert.equal(errors[0].message, 'Debes seleccionar un formulario')
})

test('validateBlocks accepts FORM with formId', () => {
  const errors = validateBlocks([block('FORM', { title: '', formId: 5, formSlug: 'mi-form' })])
  assert.deepEqual(errors, [])
})
```

- [ ] **Step 4: Verificar que los tests fallan**

```bash
cd /Users/noeli/Documents/Develop/rui && node --import tsx --test lib/funnels/builder-validation.test.ts
```

Expected: los 2 tests nuevos fallan (FORM validation no existe aún).

- [ ] **Step 5: Añadir regla FORM en `lib/funnels/builder-validation.ts`**

Añadir dentro del bucle `for`, después del bloque `CUSTOM_HTML`:
```ts
if (block.type === 'FORM' && !cfg.formId) {
  errors.push({ blockId: block.id, message: 'Debes seleccionar un formulario' })
}
```

- [ ] **Step 6: Verificar que todos los tests pasan**

```bash
cd /Users/noeli/Documents/Develop/rui && node --import tsx --test lib/funnels/builder-validation.test.ts
```

Expected: 11/11 tests passing.

- [ ] **Step 7: Commit**

```bash
git add lib/funnels/types.ts lib/funnels/defaults.ts lib/funnels/builder-validation.ts lib/funnels/builder-validation.test.ts
git commit -m "feat: add FormCacheEntry type, update FORM default config, add FORM validation rule"
```

---

### Task 2: Server actions para listar y obtener forms

**Files:**
- Modify: `app/crm/landings/actions.ts`

- [ ] **Step 1: Añadir imports en `app/crm/landings/actions.ts`**

Al principio del archivo, tras el import de `defaultTheme`, añadir:
```ts
import { listForms, getForm } from '@/lib/services/forms'
import type { FormCacheEntry } from '@/lib/funnels/types'
```

- [ ] **Step 2: Añadir `listPublishedFormsAction` al final del archivo**

```ts
export async function listPublishedFormsAction(): Promise<
  { id: number; name: string; slug: string; fieldCount: number }[]
> {
  const result = await listForms()
  if (!result.ok) return []
  return result.data
    .filter((f) => f.status === 'PUBLISHED')
    .map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      fieldCount: f._count.fields,
    }))
}
```

- [ ] **Step 3: Añadir `getFormDetailAction` al final del archivo**

```ts
export async function getFormDetailAction(formId: number): Promise<FormCacheEntry | null> {
  const result = await getForm(formId)
  if (!result.ok) return null
  const f = result.data
  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    submitLabel: f.submitLabel,
    successMessage: f.successMessage,
    fields: f.fields.map((field) => ({
      id: field.id,
      label: field.label,
      fieldKey: field.fieldKey,
      type: field.type,
      placeholder: field.placeholder,
      isRequired: field.isRequired,
    })),
  }
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add app/crm/landings/actions.ts
git commit -m "feat: add listPublishedFormsAction and getFormDetailAction server actions"
```

---

### Task 3: Actualizar `renderFunnelBlocks` para forms reales

**Files:**
- Modify: `lib/funnels/render.ts`

El FORM block necesita tres modos:
- **`formElements[formId]`** presente (public page): renderiza el elemento pre-construido (funcional)
- **`formsCache[formId]`** presente (builder): renderiza preview estático de campos
- **Sin formId**: renderiza placeholder "Selecciona un formulario"
- **Legacy `registerForm`**: se mantiene como fallback

- [ ] **Step 1: Ampliar `RenderOptions` en `lib/funnels/render.ts`**

Reemplazar el tipo `RenderOptions` (líneas 5–11) con:
```ts
import type { FormCacheEntry } from './types'

type RenderOptions = {
  blocks: FunnelBlock[]
  theme: FunnelTheme
  registerForm?: React.ReactNode
  webinarEmbedUrl?: string | null
  webinarLink?: string | null
  formsCache?: Record<number, FormCacheEntry>
  formElements?: Record<number, React.ReactNode>
}
```

- [ ] **Step 2: Reemplazar el bloque FORM (líneas 62–73) con la nueva lógica**

Reemplazar:
```ts
if (block.type === 'FORM') {
  return React.createElement(
    'section',
    { key: block.id, id: 'registro', style: { ...sectionStyle(theme), padding: '3rem 1.25rem' } },
    React.createElement(
      'div',
      { style: { maxWidth: 520, margin: '0 auto', background: theme.surfaceColor, padding: '2rem', border: `1px solid ${theme.accentColor}33` } },
      React.createElement('h2', { style: { marginTop: 0 } }, asText(cfg.title, 'Reserva tu lugar')),
      registerForm,
    ),
  )
}
```

con:
```ts
if (block.type === 'FORM') {
  const formId = typeof cfg.formId === 'number' ? cfg.formId : null
  const formElement = formId != null ? formElements?.[formId] : undefined
  const formData = formId != null ? formsCache?.[formId] : undefined
  const title = asText(cfg.title) || formData?.name || 'Reserva tu lugar'

  let content: React.ReactNode
  if (formElement != null) {
    content = formElement
  } else if (formData != null) {
    content = React.createElement(
      'div',
      { style: { display: 'grid', gap: '1rem' } },
      ...formData.fields.map((f) =>
        React.createElement(
          'label',
          {
            key: f.id,
            style: { display: 'grid', gap: '.35rem', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '.14em' },
          },
          `${f.label}${f.isRequired ? ' *' : ''}`,
          React.createElement('input', {
            placeholder: f.placeholder ?? '',
            disabled: true,
            style: { minHeight: 44, border: `1px solid ${theme.accentColor}55`, background: '#fff', padding: '0 .9rem', fontSize: 16 },
          }),
        ),
      ),
      React.createElement(
        'button',
        {
          disabled: true,
          style: { border: `1px solid ${theme.accentColor}`, background: theme.accentColor, color: theme.backgroundColor, padding: '1rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.14em', opacity: 0.7 },
        },
        formData.submitLabel,
      ),
    )
  } else if (formId == null) {
    content = registerForm ?? React.createElement(
      'div',
      { style: { border: '2px dashed #888', padding: '2rem', textAlign: 'center' as const, color: '#888', borderRadius: 4 } },
      'Selecciona un formulario en el panel derecho',
    )
  } else {
    content = React.createElement('div', { style: { color: '#888', padding: '1rem', textAlign: 'center' as const } }, 'Cargando formulario...')
  }

  return React.createElement(
    'section',
    { key: block.id, id: 'registro', style: { ...sectionStyle(theme), padding: '3rem 1.25rem' } },
    React.createElement(
      'div',
      { style: { maxWidth: 520, margin: '0 auto', background: theme.surfaceColor, padding: '2rem', border: `1px solid ${theme.accentColor}33` } },
      React.createElement('h2', { style: { marginTop: 0 } }, title),
      content,
    ),
  )
}
```

- [ ] **Step 3: Actualizar la firma de `renderFunnelBlocks` para incluir los nuevos parámetros**

Línea 42 — actualizar la desestructuración:
```ts
export function renderFunnelBlocks({ blocks, theme, registerForm, webinarEmbedUrl, webinarLink, formsCache, formElements }: RenderOptions) {
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add lib/funnels/render.ts
git commit -m "feat: update renderFunnelBlocks to support formsCache preview and formElements for public render"
```

---

### Task 4: `CrmFormEmbed` — componente funcional para la landing pública

**Files:**
- Create: `app/f/[slug]/[[...page]]/_components/CrmFormEmbed.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
'use client'

import { useState } from 'react'
import type React from 'react'
import type { FunnelTheme } from '@/lib/funnels/types'
import type { FormCacheEntry } from '@/lib/funnels/types'

type Props = {
  form: FormCacheEntry
  theme: FunnelTheme
}

export function CrmFormEmbed({ form, theme }: Props) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData)
    try {
      const res = await fetch(`/api/forms/${form.slug}/submit`, {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'content-type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'No pudimos enviar tus datos.')
        return
      }
      setDone(true)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <p style={{ textAlign: 'center', padding: '2rem', fontSize: '1.1rem' }}>
        {form.successMessage}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
      {form.fields.map((f) => (
        <label
          key={f.id}
          style={{ display: 'grid', gap: '.35rem', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.16em' }}
        >
          {f.label}{f.isRequired ? ' *' : ''}
          <input
            name={f.fieldKey}
            required={f.isRequired}
            placeholder={f.placeholder ?? ''}
            style={{
              minHeight: 44,
              border: `1px solid ${theme.accentColor}55`,
              background: '#fff',
              color: theme.textColor,
              padding: '0 .9rem',
              fontSize: 16,
            }}
          />
        </label>
      ))}
      {error && <p style={{ color: '#b42318', fontSize: 14, margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={pending}
        style={{
          border: `1px solid ${theme.accentColor}`,
          background: theme.accentColor,
          color: theme.backgroundColor,
          padding: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Enviando...' : form.submitLabel}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "app/f/[slug]/[[...page]]/_components/CrmFormEmbed.tsx"
git commit -m "feat: add CrmFormEmbed client component for public landing form rendering"
```

---

### Task 5: Actualizar `FormEditor` — selector de formulario

**Files:**
- Modify: `app/crm/landings/_components/builder/editors/FormEditor.tsx`

- [ ] **Step 1: Reemplazar todo el contenido del archivo**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { listPublishedFormsAction } from '../../actions'

type FormOption = { id: number; name: string; slug: string; fieldCount: number }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FormEditor({ config, onChange }: Props) {
  const [forms, setForms] = useState<FormOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublishedFormsAction().then((data) => {
      setForms(data)
      setLoading(false)
    })
  }, [])

  function handleFormSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value)
    const selected = forms.find((f) => f.id === id)
    if (selected) {
      onChange({ ...config, formId: selected.id, formSlug: selected.slug })
    } else {
      onChange({ ...config, formId: null, formSlug: null })
    }
  }

  const selectedId = typeof config.formId === 'number' ? config.formId : null

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Formulario</span>
        {loading ? (
          <select className={TOK.inputNative} disabled>
            <option>Cargando formularios…</option>
          </select>
        ) : forms.length === 0 ? (
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            No tienes formularios publicados.{' '}
            <a href="/crm/formularios" className="underline" target="_blank" rel="noreferrer">
              Crea uno aquí
            </a>
            .
          </p>
        ) : (
          <select
            className={TOK.inputNative}
            value={selectedId ?? ''}
            onChange={handleFormSelect}
          >
            <option value="">— Selecciona un formulario —</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.fieldCount} campo{f.fieldCount !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        )}
      </label>

      <label>
        <span className={TOK.label}>Título (opcional)</span>
        <input
          className={TOK.inputNative}
          placeholder="Usa el nombre del formulario si está vacío"
          value={(config.title as string) ?? ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </label>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/crm/landings/_components/builder/editors/FormEditor.tsx
git commit -m "feat: replace FormEditor with form selector using listPublishedFormsAction"
```

---

### Task 6: Actualizar `LandingBuilder` — estado `formsCache`

**Files:**
- Modify: `app/crm/landings/_components/LandingBuilder.tsx`

- [ ] **Step 1: Añadir imports**

Añadir al bloque de imports existente:
```ts
import type { FormCacheEntry } from '@/lib/funnels/types'
import { getFormDetailAction } from '../actions'
```

- [ ] **Step 2: Añadir estado `formsCache` después de `activeDragId`**

```ts
const [formsCache, setFormsCache] = useState<Record<number, FormCacheEntry>>({})
```

- [ ] **Step 3: Añadir `useEffect` que detecta cambios de formId en bloques FORM y los carga**

Añadir después del `useEffect` de keyboard shortcuts:
```ts
useEffect(() => {
  const formBlocks = blocks.filter((b) => b.type === 'FORM')
  for (const b of formBlocks) {
    const formId = typeof b.config.formId === 'number' ? b.config.formId : null
    if (formId != null && !formsCache[formId]) {
      getFormDetailAction(formId).then((entry) => {
        if (entry) {
          setFormsCache((prev) => ({ ...prev, [formId]: entry }))
        }
      })
    }
  }
}, [blocks])
```

- [ ] **Step 4: Pasar `formsCache` a `BuilderCanvas`**

En el JSX, en `<BuilderCanvas ... />`, añadir el prop:
```tsx
formsCache={formsCache}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: error de TypeScript en BuilderCanvas ("formsCache no existe en Props") — se arregla en Task 7.

- [ ] **Step 6: Commit (después de que Task 7 compile)**

Se hace el commit junto con Task 7.

---

### Task 7: Actualizar `BuilderCanvas` — pasar `formsCache` al renderer

**Files:**
- Modify: `app/crm/landings/_components/builder/BuilderCanvas.tsx`

- [ ] **Step 1: Añadir `FormCacheEntry` import y `formsCache` prop**

Al principio del archivo, añadir el import:
```ts
import type { FormCacheEntry } from '@/lib/funnels/types'
```

En el tipo `Props`, añadir:
```ts
formsCache: Record<number, FormCacheEntry>
```

- [ ] **Step 2: Añadir `formsCache` a la desestructuración del componente**

Actualizar la línea de desestructuración:
```ts
export function BuilderCanvas({
  pageId, blocks, theme, selectedId, validationErrors, isDirty, isPending, onSelect, onDelete, onSave, formsCache,
}: Props) {
```

- [ ] **Step 3: Pasar `formsCache` a `renderFunnelBlocks`**

En el map de bloques, la línea que llama `renderFunnelBlocks`:
```ts
const [rendered] = renderFunnelBlocks({ blocks: [block], theme, formsCache })
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: sin errores.

- [ ] **Step 5: Commit (Tasks 6 + 7 juntos)**

```bash
git add app/crm/landings/_components/LandingBuilder.tsx app/crm/landings/_components/builder/BuilderCanvas.tsx
git commit -m "feat: add formsCache state to LandingBuilder and pass to BuilderCanvas for WYSIWYG form preview"
```

---

### Task 8: Actualizar la landing pública — forms funcionales

**Files:**
- Modify: `app/f/[slug]/[[...page]]/page.tsx`

La public page ya fetchea bloques de BD. Necesitamos:
1. Extraer los `formId` de todos los bloques FORM
2. Buscar cada form por su `formSlug` via DB (solo forms publicados)
3. Construir un mapa `formElements: Record<number, React.ReactNode>` con `CrmFormEmbed`
4. Pasar `formElements` a `renderFunnelBlocks`

- [ ] **Step 1: Añadir imports en `app/f/[slug]/[[...page]]/page.tsx`**

Añadir tras el import de `FunnelRegisterForm`:
```ts
import { prisma } from '@/lib/prisma'
import type { FormCacheEntry } from '@/lib/funnels/types'
import { CrmFormEmbed } from './_components/CrmFormEmbed'
```

- [ ] **Step 2: Añadir función helper para extraer formIds de bloques**

Antes de `generateMetadata`, añadir:
```ts
function extractFormEntries(pageBlocks: FunnelBlock[]): { formId: number; formSlug: string }[] {
  return pageBlocks
    .filter((b) => b.type === 'FORM' && typeof b.config.formId === 'number' && typeof b.config.formSlug === 'string')
    .map((b) => ({ formId: b.config.formId as number, formSlug: b.config.formSlug as string }))
}
```

- [ ] **Step 3: Añadir fetch de forms en `PublicFunnelPage` antes del return**

Dentro de `PublicFunnelPage`, después de `const theme = normalizeTheme(funnel.theme)`, añadir:
```ts
const pageBlocks = blocks(selected.blocks)
const formEntries = extractFormEntries(pageBlocks)
const formElements: Record<number, React.ReactNode> = {}

if (formEntries.length > 0) {
  const slugs = [...new Set(formEntries.map((e) => e.formSlug))]
  const dbForms = await prisma.crmForm.findMany({
    where: { slug: { in: slugs }, status: 'PUBLISHED', deletedAt: null },
    include: { fields: { orderBy: { position: 'asc' } } },
  })
  for (const dbForm of dbForms) {
    const entry: FormCacheEntry = {
      id: dbForm.id,
      name: dbForm.name,
      slug: dbForm.slug,
      submitLabel: dbForm.submitLabel,
      successMessage: dbForm.successMessage,
      fields: dbForm.fields.map((f) => ({
        id: f.id,
        label: f.label,
        fieldKey: f.fieldKey,
        type: f.type,
        placeholder: f.placeholder,
        isRequired: f.isRequired,
      })),
    }
    const fe = formEntries.find((e) => e.formSlug === dbForm.slug)
    if (fe) {
      formElements[fe.formId] = <CrmFormEmbed form={entry} theme={theme} />
    }
  }
}
```

- [ ] **Step 4: Actualizar la llamada a `renderFunnelBlocks` para pasar `formElements`**

Reemplazar:
```tsx
renderFunnelBlocks({
  blocks: blocks(selected.blocks),
  theme,
  registerForm,
  webinarEmbedUrl: webinarUrl,
  webinarLink: funnel.webinar?.link,
})
```

con:
```tsx
renderFunnelBlocks({
  blocks: pageBlocks,
  theme,
  registerForm,
  webinarEmbedUrl: webinarUrl,
  webinarLink: funnel.webinar?.link,
  formElements,
})
```

(Nota: `pageBlocks` ya está definido arriba — no llamar `blocks(selected.blocks)` dos veces.)

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: sin errores.

- [ ] **Step 6: Verificar build**

```bash
cd /Users/noeli/Documents/Develop/rui && npm run build 2>&1 | tail -20
```

Expected: build exitoso.

- [ ] **Step 7: Commit**

```bash
git add "app/f/[slug]/[[...page]]/page.tsx"
git commit -m "feat: fetch CrmForm data in public landing page and render functional CrmFormEmbed per block"
```

---

## Verificación manual después de implementar

1. Ir a `/crm/landings` → abrir un funnel → pestaña **Contenido**
2. Arrastrar un bloque **Formulario** desde la paleta → el canvas muestra `"Selecciona un formulario en el panel derecho"`
3. Hacer clic en el bloque → panel derecho muestra el selector con los forms publicados
4. Elegir un formulario → el canvas muestra sus campos reales en tiempo real
5. Intentar guardar sin seleccionar formulario → borde rojo y mensaje de error
6. Guardar con formulario seleccionado → guarda correctamente
7. Abrir la landing pública → el bloque FORM muestra el formulario funcional con sus campos
8. Enviar el formulario en la landing pública → submission guardada en `CrmFormSubmission`
