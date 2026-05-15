# Landings Funnels Webinars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Landings section with webinar funnels, public funnel pages, registration submit, categories, theme editing, HTML mode, and minimal workflow automation.

**Architecture:** Add `Funnel`, `FunnelPage`, and category models beside the existing `Landing` models, then layer focused validators, pure rendering/config helpers, service functions, server actions, CRM pages, and public routes. Keep page content as JSON blocks for the MVP and use the existing `Flow` schema for initial automation steps.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/MariaDB, Zod, node:test, Tailwind v4, existing CRM UI tokens.

---

### Task 1: Schema And Pure Helpers

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260515120000_add_funnels/migration.sql`
- Create: `lib/funnels/types.ts`
- Create: `lib/funnels/slug.ts`
- Create: `lib/funnels/sanitize.ts`
- Create: `lib/funnels/defaults.ts`
- Create: `lib/funnels/render.ts`
- Test: `lib/funnels/funnels.test.ts`

- [ ] **Step 1: Write failing pure tests**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultWebinarPages, defaultTheme } from './defaults'
import { resolveFunnelPagePath, slugifyFunnel } from './slug'
import { sanitizeCss, sanitizeHtml } from './sanitize'

test('slugifyFunnel creates stable public slugs', () => {
  assert.equal(slugifyFunnel('Método de los 4 Ángeles'), 'metodo-de-los-4-angeles')
})

test('defaultWebinarPages creates the four required internal pages', () => {
  assert.deepEqual(defaultWebinarPages('metodo').map((page) => page.key), [
    'registration',
    'thank_you',
    'access',
    'room',
  ])
  assert.equal(defaultTheme.accentColor, '#9a7b45')
})

test('resolveFunnelPagePath maps public funnel paths to page keys', () => {
  assert.equal(resolveFunnelPagePath(undefined), 'registration')
  assert.equal(resolveFunnelPagePath('gracias'), 'thank_you')
  assert.equal(resolveFunnelPagePath('acceso'), 'access')
  assert.equal(resolveFunnelPagePath('sala'), 'room')
  assert.equal(resolveFunnelPagePath('bono'), 'bono')
})

test('sanitizeHtml and sanitizeCss strip unsafe author content', () => {
  assert.equal(sanitizeHtml('<h1 onclick="x()">Hola</h1><script>alert(1)</script>'), '<h1>Hola</h1>')
  assert.equal(sanitizeCss('body{color:red;behavior:url(x);width:expression(alert(1))}'), 'body{color:red;width:)}')
})
```

- [ ] **Step 2: Run failing tests**

Run: `node --import tsx --test lib/funnels/funnels.test.ts`
Expected: FAIL because modules do not exist.

- [ ] **Step 3: Add Prisma models and migration**

Add enums `FunnelType`, `FunnelStatus`, `FunnelPageKind`, `FunnelPageMode`; models `Funnel`, `FunnelPage`, `FunnelCategory`, `FunnelCategoryOnFunnel`; and relations on `User` and `Webinar`. Add equivalent MySQL migration SQL.

- [ ] **Step 4: Implement helpers**

Implement slug, sanitizer, default page/theme definitions, and a server renderer that can render the MVP block types into React.

- [ ] **Step 5: Verify**

Run: `node --import tsx --test lib/funnels/funnels.test.ts`
Run: `npx prisma generate`

### Task 2: Validators And Services

**Files:**
- Create: `lib/validators/funnels.ts`
- Create: `lib/services/funnels.ts`
- Test: `lib/services/funnels.test.ts`

- [ ] **Step 1: Write service behavior tests**

Use node:test for validator-level behaviors: categories normalize, create input requires webinar date for webinar funnels, publish validation requires required page keys.

- [ ] **Step 2: Implement validators**

Add Zod schemas for creating funnels, updating theme, saving pages, saving blocks, saving HTML, publishing, and registering publicly.

- [ ] **Step 3: Implement services**

Add functions: `listFunnels`, `getFunnelForStudio`, `createWebinarFunnel`, `updateFunnelTheme`, `saveFunnelPageBlocks`, `saveFunnelPageHtml`, `setFunnelStatus`, `registerForFunnel`, and category upsert helpers. Services use `requireRole`, `mapError`, `logAudit`, and Prisma transactions.

- [ ] **Step 4: Verify**

Run: `node --import tsx --test lib/services/funnels.test.ts lib/funnels/funnels.test.ts`

### Task 3: Flow Engine Minimum

**Files:**
- Create: `lib/flows/types.ts`
- Create: `lib/flows/triggers.ts`
- Create: `lib/flows/engine.ts`
- Create: `app/api/cron/flows/tick/route.ts`
- Test: `lib/flows/flows.test.ts`

- [ ] **Step 1: Write failing flow tests**

Cover trigger matching, redirect-only first position, and runAt accumulation.

- [ ] **Step 2: Implement minimal engine**

Implement `dispatch`, `findMatchingFlows`, `enqueueFlowRun`, and `processPendingSteps` for `WAIT`, `ASSIGN_TAG`, `UPDATE_CONTACT_STATUS`, `CREATE_DEAL`, `MOVE_DEAL`, `SEND_EMAIL`, and `REDIRECT`. Mark WhatsApp unsupported.

- [ ] **Step 3: Add cron route**

Protect with `Authorization: Bearer ${process.env.CRON_SECRET}`.

- [ ] **Step 4: Verify**

Run: `node --import tsx --test lib/flows/flows.test.ts`

### Task 4: CRM Actions And Navigation

**Files:**
- Create: `app/crm/landings/actions.ts`
- Create: `app/crm/landings/_lib/view-model.ts`
- Modify: `app/crm/_components/SidebarNav.tsx`
- Modify: `app/crm/_components/NavbarTitle.tsx`
- Test: `app/crm/landings/_lib/view-model.test.ts`

- [ ] **Step 1: Write failing view-model tests**

Cover tab normalization, public URL building, and category display.

- [ ] **Step 2: Implement actions**

Wrap service functions for Next Server Actions and revalidate CRM/public paths.

- [ ] **Step 3: Add nav entries**

Add `Landings` to sidebar and navbar metadata.

- [ ] **Step 4: Verify**

Run: `node --import tsx --test app/crm/landings/_lib/view-model.test.ts`

### Task 5: CRM Landings UI

**Files:**
- Create: `app/crm/landings/page.tsx`
- Create: `app/crm/landings/nuevo/page.tsx`
- Create: `app/crm/landings/[id]/page.tsx`
- Create: `app/crm/landings/_components/FunnelCreateForm.tsx`
- Create: `app/crm/landings/_components/FunnelsTable.tsx`
- Create: `app/crm/landings/_components/FunnelStudio.tsx`
- Create: `app/crm/landings/_components/FunnelThemeForm.tsx`
- Create: `app/crm/landings/_components/FunnelContentEditor.tsx`
- Create: `app/crm/landings/_components/FunnelHtmlEditor.tsx`
- Create: `app/crm/landings/_components/FunnelFlowEditor.tsx`
- Create: `app/crm/landings/_components/FunnelPublishPanel.tsx`

- [ ] **Step 1: Build list and create pages**

Implement `/crm/landings` and `/crm/landings/nuevo` using existing UI tokens and Server Components.

- [ ] **Step 2: Build Studio**

Implement Studio tabs for pages, content, theme, HTML, flow, and publication. Use simple form-based editors.

- [ ] **Step 3: Verify**

Run: `npm run typecheck`

### Task 6: Public Funnel Routes And Submit

**Files:**
- Create: `app/f/[slug]/[[...page]]/page.tsx`
- Create: `app/api/funnels/[slug]/register/route.ts`
- Create: `app/f/[slug]/_components/FunnelRegisterForm.tsx`

- [ ] **Step 1: Implement public route**

Resolve funnel and page, render visual/HTML mode, apply metadata and theme.

- [ ] **Step 2: Implement register endpoint**

Call `registerForFunnel`, dispatch flows, return `{ ok, redirectUrl }`.

- [ ] **Step 3: Implement client form**

Submit to endpoint and redirect to returned URL.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`

### Task 7: Full Verification

**Files:**
- All touched files.

- [ ] **Step 1: Run test suite**

Run all node tests used in this repo plus new tests.

- [ ] **Step 2: Run typecheck and lint**

Run `npm run typecheck` and `npm run lint`.

- [ ] **Step 3: Run build if env permits**

Run `npm run build`. If it fails because `DATABASE_URL` or live DB is missing, report that exact blocker.
