# FunnelStudio UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar FunnelStudio para mostrar el builder sin scroll, visualizar páginas como flujo horizontal interconectado con acciones por página, reemplazar el textarea JSON del editor de flujo por una UI visual de pasos, y ocultar las opciones avanzadas.

**Architecture:** Se modifica `FunnelStudio.tsx` para usar un header compacto de una sola línea y eliminar el tab HTML. Se crea `FunnelPagesTab.tsx` para el flujo horizontal de páginas. Se reescribe `FunnelFlowEditor.tsx` con un editor visual de pasos. Se añaden `addFunnelPage`/`deleteFunnelPage` al servicio y acciones. Se añade `SEND_WEBHOOK` al enum de Prisma.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, `@hugeicons/react` + `@hugeicons/core-free-icons`, `node:test` para tests

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `prisma/schema.prisma` | Modify | Añadir `SEND_WEBHOOK` a `FlowStepAction` enum |
| `lib/funnels/defaults.ts` | Modify | Añadir `pageKindDefaults()` helper |
| `lib/funnels/funnels.test.ts` | Modify | Tests para `pageKindDefaults` |
| `app/crm/landings/_lib/view-model.ts` | Modify | Eliminar `'html'` de `StudioTab` |
| `app/crm/landings/_lib/view-model.test.ts` | Modify | Actualizar test para `'html'` → fallback |
| `lib/services/funnels.ts` | Modify | Añadir `addFunnelPage()` y `deleteFunnelPage()` |
| `app/crm/landings/actions.ts` | Modify | Añadir `addFunnelPageAction`, `deleteFunnelPageAction`, `saveFlowAction` |
| `app/crm/landings/_components/FunnelStudio.tsx` | Modify | Header compacto, sin tab HTML, advanced details |
| `app/crm/landings/_components/FunnelPagesTab.tsx` | Create | Flujo horizontal visual de páginas |
| `app/crm/landings/_components/FunnelFlowEditor.tsx` | Modify | Reescribir con editor visual de pasos |

---

## Task 1: Add SEND_WEBHOOK to Prisma schema + pageKindDefaults helper

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/funnels/defaults.ts`
- Modify: `lib/funnels/funnels.test.ts`

- [ ] **Step 1: Write failing test for pageKindDefaults**

In `lib/funnels/funnels.test.ts`, add at the end:

```ts
import { pageKindDefaults } from './defaults'

test('pageKindDefaults returns correct key and slug for each kind', () => {
  assert.deepEqual(pageKindDefaults('REGISTRATION'), { title: 'Registro', key: 'registration', slug: 'registro' })
  assert.deepEqual(pageKindDefaults('THANK_YOU'), { title: 'Gracias', key: 'thank-you', slug: 'gracias' })
  assert.deepEqual(pageKindDefaults('ACCESS'), { title: 'Acceso', key: 'access', slug: 'acceso' })
  assert.deepEqual(pageKindDefaults('ROOM'), { title: 'Sala', key: 'room', slug: 'sala' })
  assert.deepEqual(pageKindDefaults('CUSTOM'), { title: 'Personalizada', key: 'custom', slug: 'custom' })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --import tsx --test lib/funnels/funnels.test.ts
```

Expected: FAIL with `pageKindDefaults is not a function` (or not exported).

- [ ] **Step 3: Add SEND_WEBHOOK to schema.prisma**

In `prisma/schema.prisma`, find the `FlowStepAction` enum and add:

```prisma
enum FlowStepAction {
  REDIRECT
  ASSIGN_TAG
  MOVE_DEAL
  CREATE_DEAL
  SEND_EMAIL
  SEND_WHATSAPP
  SEND_WEBHOOK
  UPDATE_CONTACT_STATUS
  WAIT
}
```

- [ ] **Step 4: Run migration**

```bash
npx prisma migrate dev --name add-send-webhook-action
```

Expected: Migration created and applied. `npx prisma generate` runs automatically.

- [ ] **Step 5: Add pageKindDefaults to lib/funnels/defaults.ts**

Add after the existing exports (after `defaultConfigByType`):

```ts
export type PageKindDefaults = { title: string; key: string; slug: string }

export function pageKindDefaults(kind: 'REGISTRATION' | 'THANK_YOU' | 'ACCESS' | 'ROOM' | 'CUSTOM'): PageKindDefaults {
  const map: Record<string, PageKindDefaults> = {
    REGISTRATION: { title: 'Registro',       key: 'registration', slug: 'registro' },
    THANK_YOU:    { title: 'Gracias',         key: 'thank-you',    slug: 'gracias'  },
    ACCESS:       { title: 'Acceso',          key: 'access',       slug: 'acceso'   },
    ROOM:         { title: 'Sala',            key: 'room',         slug: 'sala'     },
    CUSTOM:       { title: 'Personalizada',   key: 'custom',       slug: 'custom'   },
  }
  return map[kind] ?? map['REGISTRATION']
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
node --import tsx --test lib/funnels/funnels.test.ts
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/funnels/defaults.ts lib/funnels/funnels.test.ts
git commit -m "feat: add SEND_WEBHOOK flow action and pageKindDefaults helper"
```

---

## Task 2: Verify view-model (no type change needed)

**Note:** `'html'` stays as a valid `StudioTab` so that `?tab=html` keeps working when users click "Editar HTML" from the advanced settings drawer. The tab is hidden from the UI bar in Task 4 (FunnelStudio.tsx), not here.

**Files:**
- No changes to `app/crm/landings/_lib/view-model.ts`
- `app/crm/landings/_lib/view-model.test.ts` — verify html still valid

- [ ] **Step 1: Run existing view-model tests to confirm they pass**

```bash
node --import tsx --test "app/crm/landings/_lib/view-model.test.ts"
```

Expected: All 3 tests PASS. `normalizeStudioTab('html')` returns `'html'` (valid, just not shown in bar).

- [ ] **Step 2: Commit (no-op if no changes)**

```bash
git commit --allow-empty -m "chore: confirm view-model html tab stays valid for direct navigation"
```

---

## Task 3: Service functions + server actions for page CRUD

**Files:**
- Modify: `lib/services/funnels.ts`
- Modify: `app/crm/landings/actions.ts`

- [ ] **Step 1: Add addFunnelPage to lib/services/funnels.ts**

Add these imports at the top of `lib/services/funnels.ts` (after existing imports):

```ts
import { pageKindDefaults } from '@/lib/funnels/defaults'
import type { FunnelPageKind } from '@prisma/client'
```

Then add these two functions at the end of the file:

```ts
export async function addFunnelPage(
  funnelId: number,
  kind: FunnelPageKind,
): Promise<Result<{ id: number }>> {
  try {
    await requireRole([...LANDING_ROLES])
    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
      select: { id: true, slug: true, pages: { select: { kind: true, position: true } } },
    })
    if (!funnel) return { ok: false, error: { code: 'NOT_FOUND', message: 'Funnel no encontrado.' } }

    const alreadyExists = funnel.pages.some((p) => p.kind === kind)
    if (alreadyExists) return validationError(`Ya existe una página de tipo ${kind}.`)

    const defaults = pageKindDefaults(kind as 'REGISTRATION' | 'THANK_YOU' | 'ACCESS' | 'ROOM' | 'CUSTOM')
    const maxPosition = funnel.pages.reduce((max, p) => Math.max(max, p.position), -1)

    const page = await prisma.funnelPage.create({
      data: {
        funnelId,
        kind,
        key: defaults.key,
        slug: defaults.slug,
        title: defaults.title,
        position: maxPosition + 1,
        blocks: [],
      },
    })
    revalidateFunnel(funnel.slug)
    return { ok: true, data: { id: page.id } }
  } catch (err) {
    return { ok: false, error: mapError(err) }
  }
}

export async function deleteFunnelPage(pageId: number): Promise<Result<{ id: number }>> {
  try {
    await requireRole([...LANDING_ROLES])
    const page = await prisma.funnelPage.findUnique({
      where: { id: pageId },
      select: { id: true, funnelId: true, funnel: { select: { slug: true, pages: { select: { id: true } } } } },
    })
    if (!page) return { ok: false, error: { code: 'NOT_FOUND', message: 'Página no encontrada.' } }
    if (page.funnel.pages.length <= 1) return validationError('No puedes eliminar la única página del funnel.')

    await prisma.funnelPage.delete({ where: { id: pageId } })
    revalidateFunnel(page.funnel.slug)
    return { ok: true, data: { id: pageId } }
  } catch (err) {
    return { ok: false, error: mapError(err) }
  }
}
```

- [ ] **Step 2: Add server actions to app/crm/landings/actions.ts**

Add these imports at the top (after existing imports):

```ts
import type { FunnelPageKind } from '@prisma/client'
import { addFunnelPage, deleteFunnelPage } from '@/lib/services/funnels'
import type { FlowStepAction } from '@prisma/client'
import { saveFunnelAutomation } from '@/lib/services/funnels'
```

Then add at the end of `app/crm/landings/actions.ts`:

```ts
export async function addFunnelPageAction(
  funnelId: number,
  kind: FunnelPageKind,
): Promise<{ error?: string }> {
  const result = await addFunnelPage(funnelId, kind)
  return result.ok ? {} : { error: result.error.message }
}

export async function deleteFunnelPageAction(pageId: number): Promise<{ error?: string }> {
  const result = await deleteFunnelPage(pageId)
  return result.ok ? {} : { error: result.error.message }
}

export async function saveFlowAction(
  funnelId: number,
  trigger: 'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED',
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED',
  steps: Array<{ action: string; delayMins: number; config: Record<string, unknown> }>,
): Promise<{ error?: string }> {
  const result = await saveFunnelAutomation(funnelId, {
    trigger,
    status,
    steps: steps as Array<{ action: FlowStepAction; delayMins: number; config: Record<string, unknown> }>,
  })
  return result.ok ? {} : { error: result.error.message }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors related to new functions.

- [ ] **Step 4: Commit**

```bash
git add lib/services/funnels.ts app/crm/landings/actions.ts
git commit -m "feat: add addFunnelPage, deleteFunnelPage service functions and server actions"
```

---

## Task 4: FunnelStudio — compact header + remove HTML tab

**Files:**
- Modify: `app/crm/landings/_components/FunnelStudio.tsx`

The new header is a single flex row. The advanced settings use `<details>/<summary>` (no JS needed). The HTML tab is removed.

- [ ] **Step 1: Install HugeIcon imports check**

```bash
node -e "require('@hugeicons/core-free-icons/Eye01Icon'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 2: Rewrite FunnelStudio.tsx**

Replace the full content of `app/crm/landings/_components/FunnelStudio.tsx`:

```tsx
import Link from 'next/link'
import type { Flow, FlowStep, FunnelPage } from '@prisma/client'
import type { FunnelTheme } from '@/lib/funnels/types'
import { normalizeStudioTab, publicPageUrl, type StudioTab } from '../_lib/view-model'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { LandingBuilder } from './LandingBuilder'
import { FunnelFlowEditor } from './FunnelFlowEditor'
import { FunnelPublishPanel } from './FunnelPublishPanel'
import { FunnelThemeForm } from './FunnelThemeForm'
import { FunnelPagesTab } from './FunnelPagesTab'
import { FunnelHtmlEditor } from './FunnelHtmlEditor'
import { HugeiconsIcon } from '@hugeicons/react'
import Eye01Icon from '@hugeicons/core-free-icons/Eye01Icon'

type StudioFunnel = {
  id: number
  name: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  theme: unknown
  webinar: { title: string; link: string | null; date: Date | string } | null
  pages: FunnelPage[]
  categories: Array<{ category: { name: string } }>
}

type Automation = Flow & { steps: FlowStep[] }

const TABS: Array<[StudioTab, string]> = [
  ['paginas',    'Páginas'],
  ['contenido',  'Contenido'],
  ['tema',       'Tema'],
  ['flujo',      'Flujo'],
  ['publicacion','Publicación'],
]

export function FunnelStudio({
  funnel,
  tab,
  pageId,
  automations,
}: {
  funnel: StudioFunnel
  tab: string | undefined
  pageId: string | undefined
  automations: Automation[]
}) {
  const activeTab = normalizeStudioTab(tab)
  const selectedPage = funnel.pages.find((page) => String(page.id) === pageId) ?? funnel.pages[0]
  const statusLabel = funnel.status === 'PUBLISHED' ? 'Publicado' : funnel.status === 'ARCHIVED' ? 'Archivado' : 'Borrador'
  const statusColor = funnel.status === 'PUBLISHED'
    ? 'bg-[var(--color-success-container)] text-[var(--color-on-success-container)]'
    : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'

  return (
    <div className="flex flex-col gap-3">
      {/* Compact header */}
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/crm/landings" className={TOK.linkBack}>←</Link>
          <span className="truncate font-semibold text-[var(--color-on-surface)]">{funnel.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] select-none">
              Avanzado
            </summary>
            <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Configuración avanzada</p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <div>
                  <span className="text-xs text-[var(--color-on-surface-variant)]">URL pública</span>
                  <p className="font-mono text-xs text-[var(--color-on-surface)]">/f/{funnel.slug}</p>
                </div>
                {funnel.webinar && (
                  <div>
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Webinar</span>
                    <p className="text-xs text-[var(--color-on-surface)]">{funnel.webinar.title}</p>
                  </div>
                )}
                {selectedPage && (
                  <div className="border-t border-[var(--color-outline-variant)] pt-2">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Página activa</span>
                    <p className="text-xs text-[var(--color-on-surface)]">{selectedPage.title ?? selectedPage.key} — modo {selectedPage.mode}</p>
                    {selectedPage.mode === 'HTML' && (
                      <Link
                        href={`/crm/landings/${funnel.id}?tab=html&page=${selectedPage.id}`}
                        className="mt-1 inline-block text-xs text-[var(--color-primary)] underline"
                      >
                        Editar HTML
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </details>
          <a
            href={publicPageUrl(funnel.slug, selectedPage?.key ?? 'registration', selectedPage?.slug ?? null)}
            target="_blank"
            rel="noreferrer"
            className={`${TOK.actionSecondary} flex items-center gap-1.5`}
          >
            <HugeiconsIcon icon={Eye01Icon} size={14} />
            Ver
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/crm/landings/${funnel.id}?tab=${key}${selectedPage ? `&page=${selectedPage.id}` : ''}`}
            className={`rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold transition ${
              activeTab === key
                ? 'bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)]'
                : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'paginas' && (
        <FunnelPagesTab funnel={funnel} />
      )}
      {activeTab === 'contenido' && selectedPage && (
        <LandingBuilder page={selectedPage} theme={funnel.theme as FunnelTheme | null | undefined} />
      )}
      {activeTab === 'tema' && <FunnelThemeForm funnelId={funnel.id} theme={funnel.theme} />}
      {activeTab === 'flujo' && <FunnelFlowEditor funnelId={funnel.id} automations={automations} />}
      {activeTab === 'publicacion' && <FunnelPublishPanel funnel={funnel} />}
      {/* html tab hidden from tab bar but still accessible via advanced settings drawer */}
      {activeTab === 'html' && selectedPage && <FunnelHtmlEditor page={selectedPage} />}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "FunnelStudio" | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/crm/landings/_components/FunnelStudio.tsx
git commit -m "feat: compact FunnelStudio header and hide HTML tab from main nav"
```

---

## Task 5: FunnelPagesTab — horizontal page flow

**Files:**
- Create: `app/crm/landings/_components/FunnelPagesTab.tsx`

This is a client component because it calls server actions on button clicks.

Page kind → HugeIcon mapping:
- REGISTRATION → `UserAdd01Icon`
- THANK_YOU → `CheckmarkCircle01Icon`
- ACCESS → `LockPasswordIcon`
- ROOM → `Video01Icon`
- CUSTOM → `File01Icon`

- [ ] **Step 1: Create FunnelPagesTab.tsx**

```tsx
'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import type { FunnelPage } from '@prisma/client'
import { HugeiconsIcon } from '@hugeicons/react'
import Edit02Icon from '@hugeicons/core-free-icons/Edit02Icon'
import Eye01Icon from '@hugeicons/core-free-icons/Eye01Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import UserAdd01Icon from '@hugeicons/core-free-icons/UserAdd01Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import LockPasswordIcon from '@hugeicons/core-free-icons/LockPasswordIcon'
import Video01Icon from '@hugeicons/core-free-icons/Video01Icon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import { addFunnelPageAction, deleteFunnelPageAction } from '../actions'
import { publicPageUrl } from '../_lib/view-model'

type FunnelPageKind = 'REGISTRATION' | 'THANK_YOU' | 'ACCESS' | 'ROOM' | 'CUSTOM'

const KIND_LABELS: Record<FunnelPageKind, string> = {
  REGISTRATION: 'Registro',
  THANK_YOU:    'Gracias',
  ACCESS:       'Acceso',
  ROOM:         'Sala',
  CUSTOM:       'Personalizada',
}

const KIND_ICONS: Record<FunnelPageKind, typeof UserAdd01Icon> = {
  REGISTRATION: UserAdd01Icon,
  THANK_YOU:    CheckmarkCircle01Icon,
  ACCESS:       LockPasswordIcon,
  ROOM:         Video01Icon,
  CUSTOM:       File01Icon,
}

const ALL_KINDS: FunnelPageKind[] = ['REGISTRATION', 'THANK_YOU', 'ACCESS', 'ROOM']

type StudioFunnel = {
  id: number
  slug: string
  pages: FunnelPage[]
}

export function FunnelPagesTab({ funnel }: { funnel: StudioFunnel }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const existingKinds = new Set(funnel.pages.map((p) => p.kind as FunnelPageKind))
  const availableKinds = ALL_KINDS.filter((k) => !existingKinds.has(k))

  function handleAdd(kind: FunnelPageKind) {
    setShowAddMenu(false)
    setError(null)
    startTransition(async () => {
      const result = await addFunnelPageAction(funnel.id, kind)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete(pageId: number, title: string) {
    if (!confirm(`¿Eliminar la página "${title}"? Esta acción no se puede deshacer.`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteFunnelPageAction(pageId)
      if (result.error) setError(result.error)
    })
  }

  const sortedPages = [...funnel.pages].sort((a, b) => a.position - b.position)

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-6">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
        Flujo de páginas
      </h2>

      <div className="flex flex-wrap items-start gap-2">
        {sortedPages.map((page, index) => {
          const kind = page.kind as FunnelPageKind
          const Icon = KIND_ICONS[kind] ?? File01Icon
          const pageTitle = page.title ?? KIND_LABELS[kind] ?? page.key
          const pageUrl = publicPageUrl(funnel.slug, page.key, page.slug)

          return (
            <div key={page.id} className="flex items-start gap-2">
              <div className="flex w-40 flex-col gap-2 rounded-[var(--radius-lg)] border-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-3">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Icon} size={18} className="shrink-0 text-[var(--color-primary)]" />
                  <span className="truncate text-xs font-semibold text-[var(--color-on-surface)]">{pageTitle}</span>
                </div>
                <p className="truncate font-mono text-[10px] text-[var(--color-on-surface-variant)]">{pageUrl}</p>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/crm/landings/${funnel.id}?tab=contenido&page=${page.id}`}
                    title="Editar"
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
                  >
                    <HugeiconsIcon icon={Edit02Icon} size={14} />
                  </Link>
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Previsualizar"
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
                  >
                    <HugeiconsIcon icon={Eye01Icon} size={14} />
                  </a>
                  <button
                    type="button"
                    title="Eliminar"
                    disabled={isPending}
                    onClick={() => handleDelete(page.id, pageTitle)}
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] disabled:opacity-40"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
              </div>

              {index < sortedPages.length - 1 && (
                <div className="mt-8 text-[var(--color-on-surface-variant)]">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </div>
              )}
            </div>
          )
        })}

        {/* Add page button */}
        {availableKinds.length > 0 && (
          <div className="relative mt-0 flex items-start">
            {sortedPages.length > 0 && (
              <div className="mt-8 mr-2 text-[var(--color-on-surface-variant)]">
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowAddMenu((v) => !v)}
                className="flex h-[104px] w-40 flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={20} />
                <span className="text-xs font-semibold">Agregar página</span>
              </button>
              {showAddMenu && (
                <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] py-1 shadow-lg">
                  {availableKinds.map((kind) => {
                    const Icon = KIND_ICONS[kind]
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => handleAdd(kind)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]"
                      >
                        <HugeiconsIcon icon={Icon} size={16} className="text-[var(--color-primary)]" />
                        {KIND_LABELS[kind]}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]">
          {error}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "FunnelPagesTab" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/crm/landings/_components/FunnelPagesTab.tsx
git commit -m "feat: add FunnelPagesTab with horizontal visual page flow and per-page actions"
```

---

## Task 6: FunnelFlowEditor — visual step editor

**Files:**
- Modify: `app/crm/landings/_components/FunnelFlowEditor.tsx`

The visual step editor maps between a discriminated union `VisualStep` and the underlying `FlowStepAction` format. The conversion logic lives in the component file.

- [ ] **Step 1: Write the conversion utilities test**

Create `lib/funnels/flow-steps.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { visualStepsToService, serviceStepsToVisual } from './flow-steps'

test('visualStepsToService converts email step', () => {
  const result = visualStepsToService([
    { id: 'a', type: 'email', subject: 'Hola', body: 'Bienvenido' },
  ])
  assert.deepEqual(result, [
    { action: 'SEND_EMAIL', delayMins: 0, config: { subject: 'Hola', body: 'Bienvenido' } },
  ])
})

test('visualStepsToService converts wait step in hours', () => {
  const result = visualStepsToService([{ id: 'b', type: 'wait', amount: 3, unit: 'hours' }])
  assert.deepEqual(result, [{ action: 'WAIT', delayMins: 180, config: {} }])
})

test('visualStepsToService converts wait step in days', () => {
  const result = visualStepsToService([{ id: 'c', type: 'wait', amount: 2, unit: 'days' }])
  assert.deepEqual(result, [{ action: 'WAIT', delayMins: 2880, config: {} }])
})

test('visualStepsToService converts tag step', () => {
  const result = visualStepsToService([{ id: 'd', type: 'tag', tag: 'asistente' }])
  assert.deepEqual(result, [{ action: 'ASSIGN_TAG', delayMins: 0, config: { tagName: 'asistente' } }])
})

test('visualStepsToService converts webhook step', () => {
  const result = visualStepsToService([
    { id: 'e', type: 'webhook', url: 'https://example.com/hook', method: 'POST' as const },
  ])
  assert.deepEqual(result, [
    { action: 'SEND_WEBHOOK', delayMins: 0, config: { url: 'https://example.com/hook', method: 'POST' } },
  ])
})

test('serviceStepsToVisual skips unsupported actions', () => {
  const result = serviceStepsToVisual([
    { action: 'UPDATE_CONTACT_STATUS', delayMins: 0, config: { status: 'QUALIFIED' } },
    { action: 'SEND_EMAIL', delayMins: 0, config: { subject: 'Hi', body: 'Hello' } },
  ])
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'email')
})

test('serviceStepsToVisual converts wait back to hours when less than a day', () => {
  const result = serviceStepsToVisual([{ action: 'WAIT', delayMins: 120, config: {} }])
  assert.deepEqual(result[0], { id: result[0].id, type: 'wait', amount: 2, unit: 'hours' })
})

test('serviceStepsToVisual converts wait back to days when >= 1440 mins', () => {
  const result = serviceStepsToVisual([{ action: 'WAIT', delayMins: 2880, config: {} }])
  assert.deepEqual(result[0], { id: result[0].id, type: 'wait', amount: 2, unit: 'days' })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --import tsx --test lib/funnels/flow-steps.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create lib/funnels/flow-steps.ts**

```ts
export type EmailStep   = { id: string; type: 'email';   subject: string; body: string }
export type WaitStep    = { id: string; type: 'wait';    amount: number; unit: 'hours' | 'days' }
export type TagStep     = { id: string; type: 'tag';     tag: string }
export type WebhookStep = { id: string; type: 'webhook'; url: string; method: 'POST' | 'GET' }
export type VisualStep  = EmailStep | WaitStep | TagStep | WebhookStep

type ServiceStep = { action: string; delayMins: number; config: Record<string, unknown> }

export function visualStepsToService(steps: VisualStep[]): ServiceStep[] {
  return steps.map((step) => {
    if (step.type === 'email') {
      return { action: 'SEND_EMAIL', delayMins: 0, config: { subject: step.subject, body: step.body } }
    }
    if (step.type === 'wait') {
      const delayMins = step.unit === 'hours' ? step.amount * 60 : step.amount * 1440
      return { action: 'WAIT', delayMins, config: {} }
    }
    if (step.type === 'tag') {
      return { action: 'ASSIGN_TAG', delayMins: 0, config: { tagName: step.tag } }
    }
    return { action: 'SEND_WEBHOOK', delayMins: 0, config: { url: step.url, method: step.method } }
  })
}

export function serviceStepsToVisual(steps: ServiceStep[]): VisualStep[] {
  const result: VisualStep[] = []
  for (const step of steps) {
    const id = crypto.randomUUID()
    if (step.action === 'SEND_EMAIL') {
      result.push({ id, type: 'email', subject: String(step.config.subject ?? ''), body: String(step.config.body ?? '') })
    } else if (step.action === 'WAIT') {
      const mins = step.delayMins
      if (mins >= 1440 && mins % 1440 === 0) {
        result.push({ id, type: 'wait', amount: mins / 1440, unit: 'days' })
      } else {
        result.push({ id, type: 'wait', amount: Math.round(mins / 60) || 1, unit: 'hours' })
      }
    } else if (step.action === 'ASSIGN_TAG') {
      result.push({ id, type: 'tag', tag: String(step.config.tagName ?? '') })
    } else if (step.action === 'SEND_WEBHOOK') {
      result.push({ id, type: 'webhook', url: String(step.config.url ?? ''), method: (step.config.method as 'POST' | 'GET') ?? 'POST' })
    }
    // Unsupported actions are silently skipped
  }
  return result
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --import tsx --test lib/funnels/flow-steps.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Rewrite FunnelFlowEditor.tsx**

Replace the full content of `app/crm/landings/_components/FunnelFlowEditor.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import type { Flow, FlowStep } from '@prisma/client'
import { HugeiconsIcon } from '@hugeicons/react'
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import Tag01Icon from '@hugeicons/core-free-icons/Tag01Icon'
import LinkSquare01Icon from '@hugeicons/core-free-icons/LinkSquare01Icon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import Edit02Icon from '@hugeicons/core-free-icons/Edit02Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Flash01Icon from '@hugeicons/core-free-icons/Flash01Icon'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { saveFlowAction } from '../actions'
import {
  type VisualStep,
  visualStepsToService,
  serviceStepsToVisual,
} from '@/lib/funnels/flow-steps'

type Automation = Flow & { steps: FlowStep[] }

type StepType = 'email' | 'wait' | 'tag' | 'webhook'

const STEP_META: Record<StepType, { icon: typeof Mail01Icon; label: string }> = {
  email:   { icon: Mail01Icon,       label: 'Enviar correo'  },
  wait:    { icon: Clock01Icon,      label: 'Esperar'        },
  tag:     { icon: Tag01Icon,        label: 'Etiquetar'      },
  webhook: { icon: LinkSquare01Icon, label: 'Webhook'        },
}

function stepSummary(step: VisualStep): string {
  if (step.type === 'email')   return step.subject ? `"${step.subject}"` : 'Sin asunto'
  if (step.type === 'wait')    return `${step.amount} ${step.unit === 'hours' ? 'hora(s)' : 'día(s)'}`
  if (step.type === 'tag')     return step.tag || 'Sin etiqueta'
  if (step.type === 'webhook') return step.url || 'Sin URL'
  return ''
}

function defaultStep(type: StepType): VisualStep {
  const id = crypto.randomUUID()
  if (type === 'email')   return { id, type: 'email',   subject: '', body: '' }
  if (type === 'wait')    return { id, type: 'wait',    amount: 1, unit: 'days' }
  if (type === 'tag')     return { id, type: 'tag',     tag: '' }
  return { id, type: 'webhook', url: '', method: 'POST' }
}

function StepForm({
  step,
  onChange,
}: {
  step: VisualStep
  onChange: (updated: VisualStep) => void
}) {
  if (step.type === 'email') {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <input
          className={TOK.inputNative}
          placeholder="Asunto del correo"
          value={step.subject}
          onChange={(e) => onChange({ ...step, subject: e.target.value })}
        />
        <textarea
          className={TOK.inputNativeMultiline}
          placeholder="Cuerpo del mensaje"
          rows={4}
          value={step.body}
          onChange={(e) => onChange({ ...step, body: e.target.value })}
        />
      </div>
    )
  }
  if (step.type === 'wait') {
    return (
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          min={1}
          className={`${TOK.inputNative} w-24`}
          value={step.amount}
          onChange={(e) => onChange({ ...step, amount: Math.max(1, Number(e.target.value)) })}
        />
        <select
          className={TOK.inputNative}
          value={step.unit}
          onChange={(e) => onChange({ ...step, unit: e.target.value as 'hours' | 'days' })}
        >
          <option value="hours">Horas</option>
          <option value="days">Días</option>
        </select>
      </div>
    )
  }
  if (step.type === 'tag') {
    return (
      <div className="mt-2">
        <input
          className={TOK.inputNative}
          placeholder="Nombre de la etiqueta"
          value={step.tag}
          onChange={(e) => onChange({ ...step, tag: e.target.value })}
        />
      </div>
    )
  }
  if (step.type === 'webhook') {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <input
          className={TOK.inputNative}
          placeholder="https://tu-endpoint.com/webhook"
          value={step.url}
          onChange={(e) => onChange({ ...step, url: e.target.value })}
        />
        <select
          className={TOK.inputNative}
          value={step.method}
          onChange={(e) => onChange({ ...step, method: e.target.value as 'POST' | 'GET' })}
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
        </select>
      </div>
    )
  }
  return null
}

export function FunnelFlowEditor({
  funnelId,
  automations,
}: {
  funnelId: number
  automations: Automation[]
}) {
  const automation = automations[0]

  const initialSteps = automation?.steps.length
    ? serviceStepsToVisual(
        automation.steps.map((s) => ({
          action: s.action ?? '',
          delayMins: s.delayMins ?? 0,
          config: (s.config ?? {}) as Record<string, unknown>,
        })),
      )
    : []

  const [trigger, setTrigger] = useState<'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED'>(
    (automation?.trigger as 'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED') ?? 'LANDING_SUBMITTED',
  )
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'PAUSED'>(
    (automation?.status as 'DRAFT' | 'ACTIVE' | 'PAUSED') ?? 'DRAFT',
  )
  const [steps, setSteps] = useState<VisualStep[]>(initialSteps)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function addStep(type: StepType) {
    setShowAddMenu(false)
    setSteps((prev) => [...prev, defaultStep(type)])
  }

  function updateStep(updated: VisualStep) {
    setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const serviceSteps = visualStepsToService(steps)
      const result = await saveFlowAction(funnelId, trigger, status, serviceSteps)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  const TRIGGER_LABELS: Record<string, string> = {
    LANDING_SUBMITTED: 'Registro completado',
    WEBINAR_REGISTERED: 'Registrado al webinar',
  }

  return (
    <div className={`${TOK.panel} ${TOK.panelPad}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={TOK.sectionTitle}>Flujo y automatizaciones</h2>
          <p className={`mt-1 ${TOK.sectionSubtitle}`}>
            Configura lo que ocurre automáticamente cuando alguien se registra.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className={TOK.inputNative}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'PAUSED')}
          >
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activo</option>
            <option value="PAUSED">Pausado</option>
          </select>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)] disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar flujo'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-0">
        {/* Trigger */}
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)] bg-[var(--color-primary-container,#e8f0fe)] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)]">
            <HugeiconsIcon icon={Flash01Icon} size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Disparador</span>
            <select
              className="border-0 bg-transparent text-sm font-semibold text-[var(--color-on-surface)] focus:outline-none"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as 'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED')}
            >
              <option value="LANDING_SUBMITTED">Registro completado</option>
              <option value="WEBINAR_REGISTERED">Registrado al webinar</option>
            </select>
          </div>
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const meta = STEP_META[step.type]
          const isEditing = editingId === step.id
          return (
            <div key={step.id}>
              {/* Connector */}
              <div className="ml-[1.1rem] h-6 w-0.5 bg-[var(--color-outline-variant)]" />
              {/* Step card */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
                    <HugeiconsIcon icon={meta.icon} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">{meta.label}</span>
                    <p className="truncate text-sm text-[var(--color-on-surface)]">{stepSummary(step)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : step.id)}
                      className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                      title={isEditing ? 'Cerrar' : 'Editar'}
                    >
                      <HugeiconsIcon icon={isEditing ? CheckmarkCircle01Icon : Edit02Icon} size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]"
                      title="Eliminar"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <StepForm step={step} onChange={updateStep} />
                )}
              </div>
            </div>
          )
        })}

        {/* Add step */}
        <div className="relative mt-4 ml-0">
          <div className={steps.length > 0 ? 'ml-[1.1rem] h-6 w-0.5 bg-[var(--color-outline-variant)]' : 'hidden'} />
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowAddMenu((v) => !v)}
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline-variant)] px-4 py-2 text-sm text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              Agregar paso
            </button>
            {showAddMenu && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] py-1 shadow-lg">
                {(Object.entries(STEP_META) as [StepType, { icon: typeof Mail01Icon; label: string }][]).map(([type, meta]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addStep(type)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]"
                  >
                    <HugeiconsIcon icon={meta.icon} size={15} className="text-[var(--color-primary)]" />
                    {meta.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success-container,#e8f5e9)] px-4 py-3 text-sm text-[var(--color-on-success-container,#1b5e20)]">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
          Flujo guardado correctamente
        </div>
      )}
      {error && (
        <div className={`${TOK.errorBox} mt-4`}>{error}</div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run conversion tests**

```bash
node --import tsx --test lib/funnels/flow-steps.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "FunnelFlowEditor|flow-steps" | head -10
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add app/crm/landings/_components/FunnelFlowEditor.tsx lib/funnels/flow-steps.ts lib/funnels/flow-steps.test.ts
git commit -m "feat: replace JSON textarea in FunnelFlowEditor with visual step editor"
```
