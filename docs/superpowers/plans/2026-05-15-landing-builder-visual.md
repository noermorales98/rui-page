# Landing Builder Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar `FunnelContentEditor` con un builder visual tipo Gutenberg de 3 columnas (paleta · canvas WYSIWYG · panel de propiedades) con drag & drop completo.

**Architecture:** `LandingBuilder` (cliente) orquesta tres paneles dentro de un `DndContext`. El canvas renderiza cada bloque con `renderFunnelBlocks([block], theme)` envuelto en `SortableBlockWrapper`. El panel derecho carga un editor específico por tipo. El guardado reutiliza `saveBlocksAction` vía `requestSubmit()` en un form oculto.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@dnd-kit/core` + `@dnd-kit/sortable`, `node:test`, Tailwind v4, TOK design tokens.

---

## File Map

| Acción | Ruta |
|--------|------|
| Modify | `lib/funnels/defaults.ts` — agregar `defaultConfigByType` |
| Create | `lib/funnels/builder-validation.ts` |
| Create | `lib/funnels/builder-validation.test.ts` |
| Create | `app/crm/landings/_components/builder/BlockPalette.tsx` |
| Create | `app/crm/landings/_components/builder/SortableBlockWrapper.tsx` |
| Create | `app/crm/landings/_components/builder/BuilderCanvas.tsx` |
| Create | `app/crm/landings/_components/builder/editors/HeroEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/TextEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/VideoEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/FormEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/CtaEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/FaqEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/TestimonialsEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/FooterEditor.tsx` |
| Create | `app/crm/landings/_components/builder/editors/CustomHtmlEditor.tsx` |
| Create | `app/crm/landings/_components/builder/BlockEditor.tsx` |
| Create | `app/crm/landings/_components/LandingBuilder.tsx` |
| Modify | `app/crm/landings/_components/FunnelStudio.tsx` — swap `FunnelContentEditor` → `LandingBuilder` |

---

### Task 1: Instalar @dnd-kit/sortable

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar dependencia**

```bash
npm install @dnd-kit/sortable
```

- [ ] **Step 2: Verificar instalación**

```bash
node -e "require('@dnd-kit/sortable'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @dnd-kit/sortable"
```

---

### Task 2: defaultConfigByType

**Files:**
- Modify: `lib/funnels/defaults.ts`
- Test: `lib/funnels/funnels.test.ts` (agregar tests a archivo existente)

- [ ] **Step 1: Agregar test que falla**

En `lib/funnels/funnels.test.ts`, añadir al final:

```ts
import { defaultConfigByType } from './defaults'

test('defaultConfigByType covers all FunnelBlockType values', () => {
  const requiredTypes = ['HERO', 'TEXT', 'VIDEO', 'FORM', 'CTA', 'FAQ', 'TESTIMONIALS', 'WEBINAR_ROOM', 'CUSTOM_HTML', 'FOOTER']
  for (const type of requiredTypes) {
    assert.ok(type in defaultConfigByType, `Missing defaultConfig for ${type}`)
    assert.equal(typeof defaultConfigByType[type as keyof typeof defaultConfigByType], 'object')
  }
})

test('defaultConfigByType HERO has title field', () => {
  assert.ok('title' in defaultConfigByType.HERO)
})

test('defaultConfigByType FAQ has items array', () => {
  assert.deepEqual(defaultConfigByType.FAQ.items, [])
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

```bash
node --import tsx --test lib/funnels/funnels.test.ts
```

Expected: FAIL — `defaultConfigByType` not exported

- [ ] **Step 3: Agregar `defaultConfigByType` en `lib/funnels/defaults.ts`**

Al final del archivo, añadir:

```ts
export const defaultConfigByType: Record<FunnelBlock['type'], Record<string, unknown>> = {
  HERO:         { eyebrow: '', title: 'Tu título', subtitle: '', ctaText: 'Quiero entrar', ctaHref: '#registro' },
  TEXT:         { heading: '', body: 'Escribe aquí el contenido...', align: 'left' },
  VIDEO:        { url: '', caption: '', aspect: '16/9' },
  FORM:         { title: 'Reserva tu lugar', submitLabel: 'Reservar mi lugar' },
  CTA:          { heading: '', body: '', buttonText: 'Quiero entrar', buttonHref: '#registro', variant: 'primary' },
  FAQ:          { heading: 'Preguntas frecuentes', items: [] },
  TESTIMONIALS: { heading: 'Lo que dicen', items: [] },
  WEBINAR_ROOM: { title: 'Webinar en vivo', body: '' },
  CUSTOM_HTML:  { html: '', css: '' },
  FOOTER:       { text: '', links: [] },
}
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

```bash
node --import tsx --test lib/funnels/funnels.test.ts
```

Expected: PASS todos los tests

- [ ] **Step 5: Commit**

```bash
git add lib/funnels/defaults.ts lib/funnels/funnels.test.ts
git commit -m "feat: add defaultConfigByType to funnels defaults"
```

---

### Task 3: Validación cliente de bloques

**Files:**
- Create: `lib/funnels/builder-validation.ts`
- Create: `lib/funnels/builder-validation.test.ts`

- [ ] **Step 1: Crear test que falla**

```bash
# Crear lib/funnels/builder-validation.test.ts
```

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { validateBlocks, isInvalidBlock } from './builder-validation'
import type { FunnelBlock } from './types'

function block(type: FunnelBlock['type'], config: Record<string, unknown>): FunnelBlock {
  return { id: `test-${type}`, type, config }
}

test('validateBlocks returns empty array when all blocks are valid', () => {
  const blocks: FunnelBlock[] = [
    block('HERO', { title: 'Hola' }),
    block('TEXT', { body: 'Contenido' }),
  ]
  assert.deepEqual(validateBlocks(blocks), [])
})

test('validateBlocks flags HERO without title', () => {
  const errors = validateBlocks([block('HERO', { title: '' })])
  assert.equal(errors.length, 1)
  assert.equal(errors[0].blockId, 'test-HERO')
})

test('validateBlocks flags VIDEO with invalid url', () => {
  const errors = validateBlocks([block('VIDEO', { url: 'https://tiktok.com/video' })])
  assert.equal(errors.length, 1)
})

test('validateBlocks accepts VIDEO with youtube url', () => {
  const errors = validateBlocks([block('VIDEO', { url: 'https://youtube.com/watch?v=abc' })])
  assert.deepEqual(errors, [])
})

test('validateBlocks accepts VIDEO with mp4 url', () => {
  const errors = validateBlocks([block('VIDEO', { url: 'https://cdn.example.com/video.mp4' })])
  assert.deepEqual(errors, [])
})

test('validateBlocks flags CTA missing buttonText', () => {
  const errors = validateBlocks([block('CTA', { buttonText: '', buttonHref: '/registro' })])
  assert.equal(errors.length, 1)
})

test('validateBlocks flags CTA missing buttonHref', () => {
  const errors = validateBlocks([block('CTA', { buttonText: 'Entrar', buttonHref: '' })])
  assert.equal(errors.length, 1)
})

test('validateBlocks flags CUSTOM_HTML with empty html', () => {
  const errors = validateBlocks([block('CUSTOM_HTML', { html: '', css: '' })])
  assert.equal(errors.length, 1)
})

test('isInvalidBlock returns true when blockId is in errors', () => {
  const errors = [{ blockId: 'abc', message: 'error' }]
  assert.equal(isInvalidBlock('abc', errors), true)
  assert.equal(isInvalidBlock('xyz', errors), false)
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

```bash
node --import tsx --test lib/funnels/builder-validation.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implementar `lib/funnels/builder-validation.ts`**

```ts
import type { FunnelBlock } from './types'

export type BlockValidationError = { blockId: string; message: string }

const VIDEO_URL_RE = /youtube\.com|vimeo\.com|\.mp4|\.webm/

export function validateBlocks(blocks: FunnelBlock[]): BlockValidationError[] {
  const errors: BlockValidationError[] = []
  for (const block of blocks) {
    const cfg = block.config
    if (block.type === 'HERO' && !cfg.title) {
      errors.push({ blockId: block.id, message: 'El título es obligatorio' })
    }
    if (block.type === 'VIDEO') {
      const url = typeof cfg.url === 'string' ? cfg.url : ''
      if (!url || !VIDEO_URL_RE.test(url)) {
        errors.push({ blockId: block.id, message: 'URL de video inválida (usa YouTube, Vimeo, .mp4 o .webm)' })
      }
    }
    if (block.type === 'CTA') {
      if (!cfg.buttonText) errors.push({ blockId: block.id, message: 'El texto del botón es obligatorio' })
      if (!cfg.buttonHref) errors.push({ blockId: block.id, message: 'El link del botón es obligatorio' })
    }
    if (block.type === 'CUSTOM_HTML' && !cfg.html) {
      errors.push({ blockId: block.id, message: 'El HTML no puede estar vacío' })
    }
  }
  return errors
}

export function isInvalidBlock(blockId: string, errors: BlockValidationError[]): boolean {
  return errors.some((e) => e.blockId === blockId)
}
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

```bash
node --import tsx --test lib/funnels/builder-validation.test.ts
```

Expected: PASS todos los tests

- [ ] **Step 5: Commit**

```bash
git add lib/funnels/builder-validation.ts lib/funnels/builder-validation.test.ts
git commit -m "feat: add builder block client-side validation"
```

---

### Task 4: BlockPalette

**Files:**
- Create: `app/crm/landings/_components/builder/BlockPalette.tsx`

- [ ] **Step 1: Crear `BlockPalette.tsx`**

```tsx
'use client'

import { useDraggable } from '@dnd-kit/core'
import type { FunnelBlockType } from '@/lib/funnels/types'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const ITEMS: Array<{ type: FunnelBlockType; label: string; icon: string }> = [
  { type: 'HERO',         label: 'Hero',        icon: '⬛' },
  { type: 'TEXT',         label: 'Texto',        icon: '📝' },
  { type: 'VIDEO',        label: 'Video',        icon: '🎥' },
  { type: 'FORM',         label: 'Formulario',   icon: '📋' },
  { type: 'CTA',          label: 'CTA',          icon: '🔘' },
  { type: 'FAQ',          label: 'FAQ',          icon: '❓' },
  { type: 'TESTIMONIALS', label: 'Testimonios',  icon: '⭐' },
  { type: 'FOOTER',       label: 'Footer',       icon: '🔗' },
  { type: 'CUSTOM_HTML',  label: 'HTML',         icon: '⌨️' },
]

function PaletteItem({ type, label, icon }: { type: FunnelBlockType; label: string; icon: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm select-none transition active:cursor-grabbing ${
        isDragging ? 'opacity-40' : 'hover:bg-[var(--color-surface-container-low)]'
      }`}
    >
      <span>{icon}</span>
      <span className="text-[var(--color-on-surface)]">{label}</span>
    </div>
  )
}

export function BlockPalette() {
  return (
    <aside className="flex w-44 shrink-0 flex-col gap-1">
      <p className={`${TOK.label} mb-2`}>Bloques</p>
      <p className="mb-3 text-xs text-[var(--color-on-surface-variant)]">Arrastra al canvas →</p>
      {ITEMS.map((item) => (
        <PaletteItem key={item.type} {...item} />
      ))}
    </aside>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores en el archivo nuevo

- [ ] **Step 3: Commit**

```bash
git add app/crm/landings/_components/builder/BlockPalette.tsx
git commit -m "feat: add BlockPalette with draggable block items"
```

---

### Task 5: SortableBlockWrapper

**Files:**
- Create: `app/crm/landings/_components/builder/SortableBlockWrapper.tsx`

- [ ] **Step 1: Crear `SortableBlockWrapper.tsx`**

```tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FunnelBlock } from '@/lib/funnels/types'

const LABELS: Record<string, string> = {
  HERO: '⬛ Hero', TEXT: '📝 Texto', VIDEO: '🎥 Video', FORM: '📋 Formulario',
  CTA: '🔘 CTA', FAQ: '❓ FAQ', TESTIMONIALS: '⭐ Testimonios',
  WEBINAR_ROOM: '📡 Sala', FOOTER: '🔗 Footer', CUSTOM_HTML: '⌨️ HTML',
}

type Props = {
  block: FunnelBlock
  isSelected: boolean
  isInvalid: boolean
  onSelect: () => void
  onDelete: () => void
  children: React.ReactNode
}

export function SortableBlockWrapper({ block, isSelected, isInvalid, onSelect, onDelete, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const borderColor = isInvalid
    ? 'border-[var(--color-error)]'
    : isSelected
    ? 'border-[var(--color-primary)]'
    : 'border-transparent hover:border-[var(--color-outline-variant)]'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={`group relative border-2 ${borderColor} transition-colors`}
      onClick={onSelect}
    >
      {/* Controls bar — visible on hover o cuando seleccionado */}
      <div
        className={`absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-2 py-1 text-xs font-semibold transition-opacity ${
          isSelected
            ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] opacity-100'
            : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100'
        }`}
      >
        <span>{LABELS[block.type] ?? block.type}</span>
        <div className="flex gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab px-1 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            aria-label="Arrastrar bloque"
          >
            ⠿
          </button>
          <button
            type="button"
            className="px-1 hover:text-[var(--color-error)]"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Eliminar bloque"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="pt-7">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add app/crm/landings/_components/builder/SortableBlockWrapper.tsx
git commit -m "feat: add SortableBlockWrapper with selection overlay"
```

---

### Task 6: BuilderCanvas

**Files:**
- Create: `app/crm/landings/_components/builder/BuilderCanvas.tsx`

- [ ] **Step 1: Crear `BuilderCanvas.tsx`**

```tsx
'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { FunnelBlock, FunnelTheme } from '@/lib/funnels/types'
import type { BlockValidationError } from '@/lib/funnels/builder-validation'
import { isInvalidBlock } from '@/lib/funnels/builder-validation'
import { renderFunnelBlocks } from '@/lib/funnels/render'
import { SortableBlockWrapper } from './SortableBlockWrapper'

type Props = {
  pageId: number
  blocks: FunnelBlock[]
  theme: FunnelTheme
  selectedId: string | null
  validationErrors: BlockValidationError[]
  isDirty: boolean
  isPending: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function BuilderCanvas({
  pageId, blocks, theme, selectedId, validationErrors, isDirty, isPending, onSelect, onDelete,
}: Props) {
  const { setNodeRef } = useDroppable({ id: 'canvas' })

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-4 py-2">
        <span className="text-sm">
          {isDirty ? (
            <span className="font-semibold text-[var(--color-error)]">● Sin guardar</span>
          ) : (
            <span className="text-[var(--color-on-surface-variant)]">Guardado</span>
          )}
        </span>
        <button
          type="submit"
          form={`builder-form-${pageId}`}
          disabled={isPending}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-1.5 text-sm font-semibold text-[var(--color-on-primary)] transition disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Scrollable canvas */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto">
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-[var(--color-on-surface-variant)]">
              Arrastra un bloque desde la paleta para comenzar
            </div>
          ) : (
            blocks.map((block) => {
              const [rendered] = renderFunnelBlocks({ blocks: [block], theme })
              return (
                <SortableBlockWrapper
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedId}
                  isInvalid={isInvalidBlock(block.id, validationErrors)}
                  onSelect={() => onSelect(block.id)}
                  onDelete={() => onDelete(block.id)}
                >
                  {rendered}
                </SortableBlockWrapper>
              )
            })
          )}
        </SortableContext>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add app/crm/landings/_components/builder/BuilderCanvas.tsx
git commit -m "feat: add BuilderCanvas with WYSIWYG sortable blocks"
```

---

### Task 7: Editores simples (Hero, Text, Video, Form, CTA, Footer)

**Files:**
- Create: `app/crm/landings/_components/builder/editors/HeroEditor.tsx`
- Create: `app/crm/landings/_components/builder/editors/TextEditor.tsx`
- Create: `app/crm/landings/_components/builder/editors/VideoEditor.tsx`
- Create: `app/crm/landings/_components/builder/editors/FormEditor.tsx`
- Create: `app/crm/landings/_components/builder/editors/CtaEditor.tsx`
- Create: `app/crm/landings/_components/builder/editors/FooterEditor.tsx`

- [ ] **Step 1: Crear `HeroEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Config = { eyebrow?: string; title?: string; subtitle?: string; ctaText?: string; ctaHref?: string }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function HeroEditor({ config, onChange }: Props) {
  const c = config as Config
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Eyebrow</span>
        <input className={TOK.inputNative} value={c.eyebrow ?? ''} onChange={(e) => set('eyebrow', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Título <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} value={c.title ?? ''} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Subtítulo</span>
        <textarea className={TOK.inputNativeMultiline} rows={3} value={c.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Texto del botón</span>
        <input className={TOK.inputNative} value={c.ctaText ?? ''} onChange={(e) => set('ctaText', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Link del botón</span>
        <input className={TOK.inputNative} value={c.ctaHref ?? ''} onChange={(e) => set('ctaHref', e.target.value)} />
      </label>
    </div>
  )
}
```

- [ ] **Step 2: Crear `TextEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function TextEditor({ config, onChange }: Props) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título de sección</span>
        <input className={TOK.inputNative} value={(config.heading as string) ?? ''} onChange={(e) => set('heading', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Cuerpo <span className="text-[var(--color-error)]">*</span></span>
        <textarea className={TOK.inputNativeMultiline} rows={6} value={(config.body as string) ?? ''} onChange={(e) => set('body', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Alineación</span>
        <select className={TOK.select} value={(config.align as string) ?? 'left'} onChange={(e) => set('align', e.target.value)}>
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
        </select>
      </label>
    </div>
  )
}
```

- [ ] **Step 3: Crear `VideoEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function VideoEditor({ config, onChange }: Props) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>URL del video <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} placeholder="https://youtube.com/..." value={(config.url as string) ?? ''} onChange={(e) => set('url', e.target.value)} />
        <span className="mt-1 block text-xs text-[var(--color-on-surface-variant)]">YouTube, Vimeo, .mp4 o .webm</span>
      </label>
      <label>
        <span className={TOK.label}>Pie de video</span>
        <input className={TOK.inputNative} value={(config.caption as string) ?? ''} onChange={(e) => set('caption', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Proporción</span>
        <select className={TOK.select} value={(config.aspect as string) ?? '16/9'} onChange={(e) => set('aspect', e.target.value)}>
          <option value="16/9">16:9</option>
          <option value="4/3">4:3</option>
        </select>
      </label>
    </div>
  )
}
```

- [ ] **Step 4: Crear `FormEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FormEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título del formulario</span>
        <input
          className={TOK.inputNative}
          value={(config.title as string) ?? ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </label>
      <p className="text-xs text-[var(--color-on-surface-variant)]">
        El formulario de registro se inyecta automáticamente. Solo puedes personalizar el título.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Crear `CtaEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function CtaEditor({ config, onChange }: Props) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título</span>
        <input className={TOK.inputNative} value={(config.heading as string) ?? ''} onChange={(e) => set('heading', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Descripción</span>
        <textarea className={TOK.inputNativeMultiline} rows={3} value={(config.body as string) ?? ''} onChange={(e) => set('body', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Texto del botón <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} value={(config.buttonText as string) ?? ''} onChange={(e) => set('buttonText', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Link del botón <span className="text-[var(--color-error)]">*</span></span>
        <input className={TOK.inputNative} value={(config.buttonHref as string) ?? ''} onChange={(e) => set('buttonHref', e.target.value)} />
      </label>
      <label>
        <span className={TOK.label}>Estilo</span>
        <select className={TOK.select} value={(config.variant as string) ?? 'primary'} onChange={(e) => set('variant', e.target.value)}>
          <option value="primary">Sólido</option>
          <option value="outline">Contorno</option>
        </select>
      </label>
    </div>
  )
}
```

- [ ] **Step 6: Crear `FooterEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type FooterLink = { label: string; href: string }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FooterEditor({ config, onChange }: Props) {
  const links = (config.links ?? []) as FooterLink[]

  function updateLink(i: number, patch: Partial<FooterLink>) {
    const next = links.map((l, idx) => (idx === i ? { ...l, ...patch } : l))
    onChange({ ...config, links: next })
  }

  function addLink() {
    onChange({ ...config, links: [...links, { label: '', href: '' }] })
  }

  function removeLink(i: number) {
    onChange({ ...config, links: links.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Texto de copyright</span>
        <input className={TOK.inputNative} value={(config.text as string) ?? ''} onChange={(e) => onChange({ ...config, text: e.target.value })} />
      </label>
      <div>
        <p className={TOK.label}>Links</p>
        {links.map((link, i) => (
          <div key={i} className="mb-2 flex items-start gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <input className={TOK.inputNative} placeholder="Texto" value={link.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
              <input className={TOK.inputNative} placeholder="URL" value={link.href} onChange={(e) => updateLink(i, { href: e.target.value })} />
            </div>
            <button type="button" className="mt-2 text-xs text-[var(--color-error)]" onClick={() => removeLink(i)}>×</button>
          </div>
        ))}
        <button type="button" className="mt-1 text-sm font-semibold text-[var(--color-primary)]" onClick={addLink}>+ Agregar link</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores

- [ ] **Step 8: Commit**

```bash
git add app/crm/landings/_components/builder/editors/HeroEditor.tsx \
        app/crm/landings/_components/builder/editors/TextEditor.tsx \
        app/crm/landings/_components/builder/editors/VideoEditor.tsx \
        app/crm/landings/_components/builder/editors/FormEditor.tsx \
        app/crm/landings/_components/builder/editors/CtaEditor.tsx \
        app/crm/landings/_components/builder/editors/FooterEditor.tsx
git commit -m "feat: add simple block editors (Hero, Text, Video, Form, CTA, Footer)"
```

---

### Task 8: Editores de listas (FAQ, Testimonials) y HTML custom

**Files:**
- Create: `app/crm/landings/_components/builder/editors/FaqEditor.tsx`
- Create: `app/crm/landings/_components/builder/editors/TestimonialsEditor.tsx`
- Create: `app/crm/landings/_components/builder/editors/CustomHtmlEditor.tsx`

- [ ] **Step 1: Crear `FaqEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type FaqItem = { question: string; answer: string }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FaqEditor({ config, onChange }: Props) {
  const items = (config.items ?? []) as FaqItem[]

  function updateItem(i: number, patch: Partial<FaqItem>) {
    onChange({ ...config, items: items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) })
  }

  function addItem() {
    onChange({ ...config, items: [...items, { question: '', answer: '' }] })
  }

  function removeItem(i: number) {
    onChange({ ...config, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título de sección</span>
        <input className={TOK.inputNative} value={(config.heading as string) ?? ''} onChange={(e) => onChange({ ...config, heading: e.target.value })} />
      </label>
      <div>
        <p className={TOK.label}>Preguntas</p>
        {items.map((item, i) => (
          <div key={i} className="mb-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] p-3">
            <input className={`${TOK.inputNative} mb-2`} placeholder="Pregunta" value={item.question} onChange={(e) => updateItem(i, { question: e.target.value })} />
            <textarea className={TOK.inputNativeMultiline} rows={2} placeholder="Respuesta" value={item.answer} onChange={(e) => updateItem(i, { answer: e.target.value })} />
            <button type="button" className="mt-2 text-xs text-[var(--color-error)]" onClick={() => removeItem(i)}>× Eliminar</button>
          </div>
        ))}
        <button type="button" className="mt-1 text-sm font-semibold text-[var(--color-primary)]" onClick={addItem}>+ Agregar pregunta</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `TestimonialsEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type TestimonialItem = { name: string; role: string; text: string }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function TestimonialsEditor({ config, onChange }: Props) {
  const items = (config.items ?? []) as TestimonialItem[]

  function updateItem(i: number, patch: Partial<TestimonialItem>) {
    onChange({ ...config, items: items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) })
  }

  function addItem() {
    onChange({ ...config, items: [...items, { name: '', role: '', text: '' }] })
  }

  function removeItem(i: number) {
    onChange({ ...config, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título de sección</span>
        <input className={TOK.inputNative} value={(config.heading as string) ?? ''} onChange={(e) => onChange({ ...config, heading: e.target.value })} />
      </label>
      <div>
        <p className={TOK.label}>Testimonios</p>
        {items.map((item, i) => (
          <div key={i} className="mb-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] p-3">
            <input className={`${TOK.inputNative} mb-2`} placeholder="Nombre" value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
            <input className={`${TOK.inputNative} mb-2`} placeholder="Rol / empresa" value={item.role} onChange={(e) => updateItem(i, { role: e.target.value })} />
            <textarea className={TOK.inputNativeMultiline} rows={3} placeholder="Testimonio" value={item.text} onChange={(e) => updateItem(i, { text: e.target.value })} />
            <button type="button" className="mt-2 text-xs text-[var(--color-error)]" onClick={() => removeItem(i)}>× Eliminar</button>
          </div>
        ))}
        <button type="button" className="mt-1 text-sm font-semibold text-[var(--color-primary)]" onClick={addItem}>+ Agregar testimonio</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear `CustomHtmlEditor.tsx`**

```tsx
'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function CustomHtmlEditor({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-sm)] bg-[var(--color-error-container)] px-3 py-2 text-xs text-[var(--color-on-error-container)]">
        Scripts e handlers inline no se permiten. El HTML se sanitiza al guardar.
      </div>
      <label>
        <span className={TOK.label}>HTML <span className="text-[var(--color-error)]">*</span></span>
        <textarea
          className={`${TOK.inputNativeMultiline} font-mono text-xs`}
          rows={10}
          value={(config.html as string) ?? ''}
          onChange={(e) => onChange({ ...config, html: e.target.value })}
          spellCheck={false}
        />
      </label>
      <label>
        <span className={TOK.label}>CSS</span>
        <textarea
          className={`${TOK.inputNativeMultiline} font-mono text-xs`}
          rows={6}
          value={(config.css as string) ?? ''}
          onChange={(e) => onChange({ ...config, css: e.target.value })}
          spellCheck={false}
        />
      </label>
    </div>
  )
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores

- [ ] **Step 5: Commit**

```bash
git add app/crm/landings/_components/builder/editors/FaqEditor.tsx \
        app/crm/landings/_components/builder/editors/TestimonialsEditor.tsx \
        app/crm/landings/_components/builder/editors/CustomHtmlEditor.tsx
git commit -m "feat: add list block editors (FAQ, Testimonials, CustomHTML)"
```

---

### Task 9: BlockEditor router

**Files:**
- Create: `app/crm/landings/_components/builder/BlockEditor.tsx`

- [ ] **Step 1: Crear `BlockEditor.tsx`**

```tsx
'use client'

import type { FunnelBlock } from '@/lib/funnels/types'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { HeroEditor }          from './editors/HeroEditor'
import { TextEditor }          from './editors/TextEditor'
import { VideoEditor }         from './editors/VideoEditor'
import { FormEditor }          from './editors/FormEditor'
import { CtaEditor }           from './editors/CtaEditor'
import { FaqEditor }           from './editors/FaqEditor'
import { TestimonialsEditor }  from './editors/TestimonialsEditor'
import { FooterEditor }        from './editors/FooterEditor'
import { CustomHtmlEditor }    from './editors/CustomHtmlEditor'

type Props = {
  block: FunnelBlock
  onUpdate: (blockId: string, newConfig: Record<string, unknown>) => void
  onDelete: (blockId: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  HERO: '⬛ Hero', TEXT: '📝 Texto', VIDEO: '🎥 Video', FORM: '📋 Formulario',
  CTA: '🔘 CTA', FAQ: '❓ FAQ', TESTIMONIALS: '⭐ Testimonios',
  WEBINAR_ROOM: '📡 Sala', FOOTER: '🔗 Footer', CUSTOM_HTML: '⌨️ HTML',
}

export function BlockEditor({ block, onUpdate, onDelete }: Props) {
  const onChange = (newConfig: Record<string, unknown>) => onUpdate(block.id, newConfig)

  function renderEditor() {
    switch (block.type) {
      case 'HERO':         return <HeroEditor         config={block.config} onChange={onChange} />
      case 'TEXT':         return <TextEditor         config={block.config} onChange={onChange} />
      case 'VIDEO':        return <VideoEditor        config={block.config} onChange={onChange} />
      case 'FORM':         return <FormEditor         config={block.config} onChange={onChange} />
      case 'CTA':          return <CtaEditor          config={block.config} onChange={onChange} />
      case 'FAQ':          return <FaqEditor          config={block.config} onChange={onChange} />
      case 'TESTIMONIALS': return <TestimonialsEditor config={block.config} onChange={onChange} />
      case 'FOOTER':       return <FooterEditor       config={block.config} onChange={onChange} />
      case 'CUSTOM_HTML':  return <CustomHtmlEditor   config={block.config} onChange={onChange} />
      case 'WEBINAR_ROOM': return (
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          El bloque de sala se configura automáticamente con los datos del webinar.
        </p>
      )
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          {TYPE_LABELS[block.type] ?? block.type}
        </p>
        <button
          type="button"
          className="text-xs text-[var(--color-error)] hover:underline"
          onClick={() => onDelete(block.id)}
        >
          Eliminar
        </button>
      </div>
      {renderEditor()}
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add app/crm/landings/_components/builder/BlockEditor.tsx
git commit -m "feat: add BlockEditor router for per-type property panels"
```

---

### Task 10: LandingBuilder — componente principal

**Files:**
- Create: `app/crm/landings/_components/LandingBuilder.tsx`

- [ ] **Step 1: Crear `LandingBuilder.tsx`**

```tsx
'use client'

import { useState, useCallback, useEffect, useRef, useActionState } from 'react'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { FunnelPage } from '@prisma/client'
import type { FunnelBlock, FunnelTheme } from '@/lib/funnels/types'
import { defaultConfigByType, defaultTheme } from '@/lib/funnels/defaults'
import { validateBlocks, type BlockValidationError } from '@/lib/funnels/builder-validation'
import { saveBlocksAction } from '../actions'
import { BlockPalette } from './builder/BlockPalette'
import { BuilderCanvas } from './builder/BuilderCanvas'
import { BlockEditor } from './builder/BlockEditor'

function coerceBlocks(value: unknown): FunnelBlock[] {
  return Array.isArray(value) ? (value as FunnelBlock[]) : []
}

function coerceTheme(value: unknown): FunnelTheme {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as FunnelTheme
  }
  return defaultTheme
}

export function LandingBuilder({ page, theme }: { page: FunnelPage; theme: unknown }) {
  const [blocks, setBlocks] = useState<FunnelBlock[]>(() => coerceBlocks(page.blocks))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [validationErrors, setValidationErrors] = useState<BlockValidationError[]>([])
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [state, action, isPending] = useActionState(saveBlocksAction.bind(null, page.id), null)

  const formRef = useRef<HTMLFormElement>(null)
  const blocksInputRef = useRef<HTMLInputElement>(null)
  const resolvedTheme = coerceTheme(theme)

  function markDirty<T>(val: T): T {
    setIsDirty(true)
    setValidationErrors([])
    return val
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('palette-')) {
      const blockType = activeId.replace('palette-', '') as FunnelBlock['type']
      const newBlock: FunnelBlock = {
        id: crypto.randomUUID(),
        type: blockType,
        config: { ...defaultConfigByType[blockType] },
      }
      const overIndex = blocks.findIndex((b) => b.id === overId)
      const insertAt = overIndex >= 0 ? overIndex + 1 : blocks.length
      setBlocks(markDirty([...blocks.slice(0, insertAt), newBlock, ...blocks.slice(insertAt)]))
      setSelectedId(newBlock.id)
      return
    }

    if (activeId !== overId) {
      const oldIdx = blocks.findIndex((b) => b.id === activeId)
      const newIdx = blocks.findIndex((b) => b.id === overId)
      if (oldIdx >= 0 && newIdx >= 0) {
        setBlocks(markDirty(arrayMove(blocks, oldIdx, newIdx)))
      }
    }
  }

  const handleUpdateBlock = useCallback((blockId: string, newConfig: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, config: newConfig } : b)))
    setIsDirty(true)
    setValidationErrors([])
  }, [])

  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    setSelectedId((prev) => (prev === blockId ? null : prev))
    setIsDirty(true)
  }, [])

  function triggerSave() {
    const errors = validateBlocks(blocks)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    if (blocksInputRef.current) {
      blocksInputRef.current.value = JSON.stringify(blocks)
    }
    formRef.current?.requestSubmit()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        triggerSave()
        return
      }
      if (e.key === 'Escape') {
        setSelectedId(null)
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          handleDeleteBlock(selectedId)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, blocks, handleDeleteBlock])

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null
  const activePaletteType = activeDragId?.startsWith('palette-')
    ? activeDragId.replace('palette-', '')
    : null

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <form
        id={`builder-form-${page.id}`}
        ref={formRef}
        action={action}
      >
        <input ref={blocksInputRef} type="hidden" name="blocks" defaultValue={JSON.stringify(blocks)} />
      </form>

      <div className="flex h-[calc(100vh-14rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)]">
        {/* Left: Palette */}
        <div className="shrink-0 overflow-y-auto border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-3">
          <BlockPalette />
        </div>

        {/* Center: Canvas */}
        <BuilderCanvas
          pageId={page.id}
          blocks={blocks}
          theme={resolvedTheme}
          selectedId={selectedId}
          validationErrors={validationErrors}
          isDirty={isDirty}
          isPending={isPending}
          onSelect={setSelectedId}
          onDelete={handleDeleteBlock}
        />

        {/* Right: Properties */}
        <div className="w-60 shrink-0 overflow-y-auto border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-4">
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onUpdate={handleUpdateBlock}
              onDelete={handleDeleteBlock}
            />
          ) : (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Selecciona un bloque del canvas para editar sus propiedades.
            </p>
          )}
        </div>
      </div>

      <DragOverlay>
        {activePaletteType && (
          <div className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-on-primary)] shadow-lg">
            + {activePaletteType}
          </div>
        )}
      </DragOverlay>

      {state?.error && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]">
          {state.error}
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]">
          Hay {validationErrors.length} bloque(s) con errores. Corrígelos antes de guardar.
        </div>
      )}
    </DndContext>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add app/crm/landings/_components/LandingBuilder.tsx
git commit -m "feat: add LandingBuilder visual editor with DnD and WYSIWYG canvas"
```

---

### Task 11: Integrar en FunnelStudio

**Files:**
- Modify: `app/crm/landings/_components/FunnelStudio.tsx`

- [ ] **Step 1: Actualizar import y reemplazar `FunnelContentEditor` por `LandingBuilder`**

En `FunnelStudio.tsx`, sustituir:

```ts
import { FunnelContentEditor } from './FunnelContentEditor'
```

por:

```ts
import { LandingBuilder } from './LandingBuilder'
```

Y sustituir el bloque que renderiza `FunnelContentEditor`:

```tsx
{activeTab === 'contenido' && selectedPage && (
  <FunnelContentEditor funnelId={funnel.id} page={selectedPage} />
)}
```

por:

```tsx
{activeTab === 'contenido' && selectedPage && (
  <LandingBuilder page={selectedPage} theme={funnel.theme} />
)}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build exitoso sin errores de compilación

- [ ] **Step 4: Commit final**

```bash
git add app/crm/landings/_components/FunnelStudio.tsx
git commit -m "feat: integrate LandingBuilder into FunnelStudio replacing FunnelContentEditor"
```

---

## Verificación manual después de implementar

1. Ir a `/crm/landings` → abrir un funnel → pestaña **Contenido**
2. Verificar que se ven las 3 columnas: paleta · canvas · propiedades
3. Arrastrar "Hero" desde la paleta → debe aparecer en el canvas
4. Hacer clic en el bloque → panel derecho muestra sus campos
5. Editar el título → canvas se actualiza en tiempo real
6. Arrastrar handle `⠿` para reordenar → bloques se mueven con animación
7. Presionar `Cmd+S` → guarda sin recargar
8. Dejar CTA sin `buttonText` → al guardar aparece error de validación en rojo
9. Presionar `Delete` con un bloque seleccionado → bloque se elimina
