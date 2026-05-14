# Sprint 5 – Zoom + Integraciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar Sprint 5 del ROADMAP: UI de conexión OAuth Zoom, cliente Zoom, sincronización de registrantes desde Zoom, webhook de asistencia, y métricas manuales Streamyard.

**Architecture:** El modelo `Integration` ya existe en schema con `config Json` para tokens cifrados. El modelo `WebinarIntegration` vincula un webinar CRM a un ID externo de Zoom. La integración vive en `lib/integrations/zoom.ts` (cliente API) y en rutas API `app/api/zoom/`. La UI de configuración es ADMIN-only en `/crm/configuracion/integraciones`. El cifrado de tokens usa `crypto` nativo de Node (AES-256-GCM), sin dependencias nuevas.

**Tech Stack:** Next.js 16 App Router, Prisma 7 + MariaDB, React 19, Tailwind CSS v4, Lucide React, Node.js crypto (built-in), fetch nativo para Zoom API.

**Variables de entorno necesarias:**
```
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=https://tudominio.com/api/zoom/oauth/callback
ZOOM_VERIFICATION_TOKEN=
INTEGRATION_ENC_KEY=   # 32 bytes hex, generado con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Estado Previo (ya implementado)

- Schema: `Integration`, `WebinarIntegration`, `IntegrationProvider`, `IntegrationStatus` ✅
- CRUD Webinar con `deletedAt`, `integration WebinarIntegration?` ✅
- Import CSV manual de registrantes ✅

---

## File Map

**Crear:**
- `lib/integrations/crypto.ts` — cifrado/descifrado AES-256-GCM para `Integration.config`
- `lib/integrations/zoom.ts` — cliente Zoom API: refresh token, fetch registrants, verify webhook
- `app/api/zoom/oauth/start/route.ts` — redirect a Zoom OAuth
- `app/api/zoom/oauth/callback/route.ts` — recibe code, intercambia por tokens, guarda en Integration
- `app/api/zoom/webhook/route.ts` — recibe eventos Zoom, verifica firma, procesa asistencia
- `app/api/zoom/sync/[webinarId]/route.ts` — sincroniza registrantes desde Zoom (llamada manual)
- `app/crm/configuracion/integraciones/page.tsx` — página ADMIN, lista integraciones
- `app/crm/configuracion/integraciones/actions.ts` — desconectar integración
- `app/crm/webinars/[id]/_components/ZoomLinkPanel.tsx` — vincular webinar a Zoom ID + botón sync

**Modificar:**
- `prisma/schema.prisma` — agregar `viewerCount Int?` a `Webinar` para métricas Streamyard
- `app/crm/webinars/actions.ts` — agregar `updateViewerCount`, `linkZoomWebinar`
- `app/crm/webinars/[id]/page.tsx` — incluir `ZoomLinkPanel` + métricas Streamyard
- `app/crm/webinars/[id]/_components/WebinarHeader.tsx` — mostrar `viewerCount` si existe
- `app/crm/configuracion/page.tsx` — agregar links a sub-secciones (usuarios, etiquetas, integraciones)
- `.env.example` — agregar variables Zoom e `INTEGRATION_ENC_KEY`

---

## Task 1: Schema + env.example

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.example` (crearlo si no existe)

- [ ] **Step 1: Agregar `viewerCount` al modelo Webinar**

En `prisma/schema.prisma`, dentro del modelo `Webinar`, agregar después de `description`:

```prisma
  viewerCount   Int?
```

- [ ] **Step 2: Push schema**

```bash
cd /Users/noeli/Documents/Develop/rui/.claude/worktrees/recursing-ardinghelli-566434
npx prisma db push
npx prisma generate
```

Expected: "Your database is now in sync with your schema."

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errores.

- [ ] **Step 4: Crear / actualizar .env.example**

Agregar al final de `.env.example`:

```
# Zoom OAuth
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=https://tudominio.com/api/zoom/oauth/callback
ZOOM_VERIFICATION_TOKEN=

# Cifrado de tokens de integración (32 bytes hex)
# Generar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INTEGRATION_ENC_KEY=
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma .env.example
git commit -m "feat(integrations): add viewerCount to Webinar + Zoom env vars"
```

---

## Task 2: Cifrado de Integration.config

**Files:**
- Create: `lib/integrations/crypto.ts`

- [ ] **Step 1: Crear helper de cifrado AES-256-GCM**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALG = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.INTEGRATION_ENC_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('INTEGRATION_ENC_KEY must be a 32-byte hex string (64 chars)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALG, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv(12):tag(16):data — all base64
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decrypt(encoded: string): string {
  const key = getKey()
  const parts = encoded.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted format')
  const iv = Buffer.from(parts[0]!, 'base64')
  const tag = Buffer.from(parts[1]!, 'base64')
  const data = Buffer.from(parts[2]!, 'base64')
  const decipher = createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data) + decipher.final('utf8')
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep "crypto.ts"
```

Expected: sin output.

- [ ] **Step 3: Commit**

```bash
git add lib/integrations/crypto.ts
git commit -m "feat(integrations): add AES-256-GCM encryption helper"
```

---

## Task 3: Cliente Zoom API

**Files:**
- Create: `lib/integrations/zoom.ts`

El cliente maneja: refresh de tokens, fetch de registrantes, y verificación de firma de webhook.

- [ ] **Step 1: Crear cliente Zoom**

```typescript
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from './crypto'
import type { Prisma } from '@prisma/client'

type ZoomTokens = {
  access_token: string
  refresh_token: string
  expires_at: number // Unix ms
}

type ZoomRegistrant = {
  id: string
  email: string
  first_name: string
  last_name: string
  status: string
}

const ZOOM_API = 'https://api.zoom.us/v2'
const ZOOM_OAUTH = 'https://zoom.us/oauth/token'

function basicAuth(): string {
  const id = process.env.ZOOM_CLIENT_ID!
  const secret = process.env.ZOOM_CLIENT_SECRET!
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`
}

export async function getZoomTokens(): Promise<ZoomTokens | null> {
  const integration = await prisma.integration.findUnique({
    where: { provider: 'ZOOM' },
  })
  if (!integration) return null

  const config = integration.config as Prisma.JsonObject
  if (!config.encrypted) return null

  const tokens = JSON.parse(decrypt(config.encrypted as string)) as ZoomTokens
  return tokens
}

export async function saveZoomTokens(tokens: ZoomTokens): Promise<void> {
  const encrypted = encrypt(JSON.stringify(tokens))
  await prisma.integration.upsert({
    where: { provider: 'ZOOM' },
    create: {
      provider: 'ZOOM',
      status: 'ACTIVE',
      config: { encrypted },
    },
    update: {
      status: 'ACTIVE',
      config: { encrypted },
      lastSyncAt: new Date(),
    },
  })
}

export async function refreshZoomToken(refreshToken: string): Promise<ZoomTokens> {
  const res = await fetch(`${ZOOM_OAUTH}?grant_type=refresh_token&refresh_token=${refreshToken}`, {
    method: 'POST',
    headers: { Authorization: basicAuth() },
  })
  if (!res.ok) throw new Error(`Zoom token refresh failed: ${res.status}`)
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await getZoomTokens()
  if (!tokens) throw new Error('Zoom no está conectado')

  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token
  }

  const refreshed = await refreshZoomToken(tokens.refresh_token)
  await saveZoomTokens(refreshed)
  return refreshed.access_token
}

export async function fetchZoomRegistrants(zoomWebinarId: string): Promise<ZoomRegistrant[]> {
  const token = await getValidAccessToken()
  const results: ZoomRegistrant[] = []
  let nextPageToken = ''

  do {
    const url = new URL(`${ZOOM_API}/webinars/${zoomWebinarId}/registrants`)
    url.searchParams.set('page_size', '300')
    if (nextPageToken) url.searchParams.set('next_page_token', nextPageToken)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      if (res.status === 404) return []
      throw new Error(`Zoom registrants fetch failed: ${res.status}`)
    }

    const data = (await res.json()) as {
      registrants: ZoomRegistrant[]
      next_page_token?: string
    }

    results.push(...data.registrants)
    nextPageToken = data.next_page_token ?? ''
  } while (nextPageToken)

  return results
}

export function verifyZoomWebhook(body: string, token: string): boolean {
  const expected = process.env.ZOOM_VERIFICATION_TOKEN
  if (!expected) return false
  return token === expected
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "zoom.ts"
```

Expected: sin output.

- [ ] **Step 3: Commit**

```bash
git add lib/integrations/zoom.ts
git commit -m "feat(integrations): add Zoom API client with OAuth token management"
```

---

## Task 4: OAuth Routes

**Files:**
- Create: `app/api/zoom/oauth/start/route.ts`
- Create: `app/api/zoom/oauth/callback/route.ts`

- [ ] **Step 1: Crear ruta de inicio OAuth**

```typescript
// app/api/zoom/oauth/start/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(): Promise<Response> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clientId = process.env.ZOOM_CLIENT_ID
  const redirectUri = process.env.ZOOM_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Zoom not configured' }, { status: 500 })
  }

  const url = new URL('https://zoom.us/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(url.toString())
}
```

- [ ] **Step 2: Crear ruta de callback OAuth**

```typescript
// app/api/zoom/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { saveZoomTokens } from '@/lib/integrations/zoom'

const ZOOM_OAUTH = 'https://zoom.us/oauth/token'

function basicAuth(): string {
  const id = process.env.ZOOM_CLIENT_ID!
  const secret = process.env.ZOOM_CLIENT_SECRET!
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`
}

export async function GET(req: NextRequest): Promise<Response> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?error=forbidden', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?error=no_code', req.url))
  }

  const redirectUri = process.env.ZOOM_REDIRECT_URI!

  try {
    const res = await fetch(
      `${ZOOM_OAUTH}?grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      { method: 'POST', headers: { Authorization: basicAuth() } },
    )

    if (!res.ok) {
      throw new Error(`Token exchange failed: ${res.status}`)
    }

    const data = (await res.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    await saveZoomTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    })

    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?success=zoom', req.url))
  } catch (err) {
    console.error('[zoom/callback]', err)
    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?error=exchange_failed', req.url))
  }
}
```

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/api/zoom/oauth/start/route.ts app/api/zoom/oauth/callback/route.ts
git commit -m "feat(integrations): add Zoom OAuth start and callback routes"
```

---

## Task 5: Sync de Registrantes + Webhook Zoom

**Files:**
- Create: `app/api/zoom/sync/[webinarId]/route.ts`
- Create: `app/api/zoom/webhook/route.ts`

- [ ] **Step 1: Crear ruta de sync manual**

```typescript
// app/api/zoom/sync/[webinarId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { fetchZoomRegistrants } from '@/lib/integrations/zoom'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ webinarId: string }> },
): Promise<Response> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { webinarId } = await params
  const crmWebinarId = Number(webinarId)
  if (isNaN(crmWebinarId)) {
    return NextResponse.json({ error: 'Invalid webinarId' }, { status: 400 })
  }

  const webinarIntegration = await prisma.webinarIntegration.findUnique({
    where: { webinarId: crmWebinarId },
  })

  if (!webinarIntegration?.externalId) {
    return NextResponse.json({ error: 'Webinar no vinculado a Zoom' }, { status: 404 })
  }

  let registrants
  try {
    registrants = await fetchZoomRegistrants(webinarIntegration.externalId)
  } catch (err) {
    console.error('[zoom/sync]', err)
    return NextResponse.json({ error: 'Error al obtener registrantes de Zoom' }, { status: 502 })
  }

  let imported = 0
  let skipped = 0

  for (const r of registrants) {
    if (!r.email?.trim()) { skipped++; continue }

    try {
      const email = r.email.trim().toLowerCase()
      const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || email

      const contact = await prisma.contact.upsert({
        where: { email },
        update: {},
        create: { name, email, source: 'WEBINAR' },
      })

      await prisma.webinarRegistration.upsert({
        where: { webinarId_contactId: { webinarId: crmWebinarId, contactId: contact.id } },
        update: {},
        create: { webinarId: crmWebinarId, contactId: contact.id, status: 'REGISTERED' },
      })

      imported++
    } catch {
      skipped++
    }
  }

  await prisma.webinarIntegration.update({
    where: { webinarId: crmWebinarId },
    data: { lastSyncAt: new Date() },
  })

  return NextResponse.json({ imported, skipped })
}
```

- [ ] **Step 2: Crear webhook Zoom**

```typescript
// app/api/zoom/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ZoomEvent = {
  event: string
  payload?: {
    object?: {
      id?: string        // webinar/meeting UUID
      registrant?: {
        email?: string
        first_name?: string
        last_name?: string
      }
      participant?: {
        email?: string
      }
    }
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const verificationToken = req.headers.get('authorization')
  const expected = process.env.ZOOM_VERIFICATION_TOKEN

  if (!expected || verificationToken !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: ZoomEvent
  try {
    body = (await req.json()) as ZoomEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body.event
  const obj = body.payload?.object

  if (!obj) return NextResponse.json({ ok: true })

  if (event === 'webinar.registration_created' || event === 'meeting.registrant_created') {
    const email = obj.registrant?.email?.trim().toLowerCase()
    const firstName = obj.registrant?.first_name ?? ''
    const lastName = obj.registrant?.last_name ?? ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || (email ?? 'Sin nombre')
    const externalId = obj.id

    if (email && externalId) {
      const wi = await prisma.webinarIntegration.findFirst({
        where: { externalId },
      })

      if (wi) {
        const contact = await prisma.contact.upsert({
          where: { email },
          update: {},
          create: { name, email, source: 'WEBINAR' },
        })

        await prisma.webinarRegistration.upsert({
          where: { webinarId_contactId: { webinarId: wi.webinarId, contactId: contact.id } },
          update: {},
          create: { webinarId: wi.webinarId, contactId: contact.id, status: 'REGISTERED' },
        })
      }
    }
  }

  if (event === 'meeting.participant_joined' || event === 'webinar.participant_joined') {
    const email = obj.participant?.email?.trim().toLowerCase()
    const externalId = obj.id

    if (email && externalId) {
      const wi = await prisma.webinarIntegration.findFirst({
        where: { externalId },
      })

      if (wi) {
        const contact = await prisma.contact.findUnique({ where: { email } })
        if (contact) {
          await prisma.webinarRegistration.updateMany({
            where: { webinarId: wi.webinarId, contactId: contact.id },
            data: { status: 'ATTENDED' },
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/api/zoom/sync/[webinarId]/route.ts app/api/zoom/webhook/route.ts
git commit -m "feat(integrations): add Zoom sync and webhook endpoints"
```

---

## Task 6: Acciones Server – linkZoomWebinar + updateViewerCount

**Files:**
- Modify: `app/crm/webinars/actions.ts`

- [ ] **Step 1: Agregar `linkZoomWebinar` y `updateViewerCount`**

Al final del archivo `app/crm/webinars/actions.ts`, agregar:

```typescript
export async function linkZoomWebinar(
  webinarId: number,
  zoomWebinarId: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const externalId = zoomWebinarId.trim()
  if (!externalId) return { error: 'El ID de Zoom es obligatorio' }

  const zoomIntegration = await prisma.integration.findUnique({ where: { provider: 'ZOOM' } })
  if (!zoomIntegration) return { error: 'Zoom no está conectado' }

  try {
    await prisma.webinarIntegration.upsert({
      where: { webinarId },
      create: {
        webinarId,
        integrationId: zoomIntegration.id,
        externalId,
      },
      update: { externalId },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Error al vincular el webinar' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}

export async function unlinkZoomWebinar(webinarId: number): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    await prisma.webinarIntegration.delete({ where: { webinarId } })
  } catch {
    // Already unlinked — ignore P2025
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}

export async function updateViewerCount(
  webinarId: number,
  viewerCount: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  if (!Number.isInteger(viewerCount) || viewerCount < 0) {
    return { error: 'Número inválido' }
  }

  try {
    await prisma.webinar.update({ where: { id: webinarId }, data: { viewerCount } })
  } catch (e) {
    console.error(e)
    return { error: 'Error al actualizar métricas' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "webinars/actions"
```

Expected: sin output.

- [ ] **Step 3: Commit**

```bash
git add app/crm/webinars/actions.ts
git commit -m "feat(webinars): add linkZoomWebinar, unlinkZoomWebinar, updateViewerCount actions"
```

---

## Task 7: ZoomLinkPanel – UI en detalle de webinar

**Files:**
- Create: `app/crm/webinars/[id]/_components/ZoomLinkPanel.tsx`

Este componente aparece en la página de detalle del webinar. Muestra el ID de Zoom vinculado (si existe), botones para vincular/desvincular, botón de sincronización manual, y el formulario de métricas Streamyard.

- [ ] **Step 1: Crear ZoomLinkPanel**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Link2, RefreshCw, Unlink } from 'lucide-react'
import { linkZoomWebinar, unlinkZoomWebinar, updateViewerCount } from '../actions'

interface Props {
  webinarId: number
  zoomWebinarId: string | null
  viewerCount: number | null
  zoomConnected: boolean
}

export function ZoomLinkPanel({ webinarId, zoomWebinarId, viewerCount, zoomConnected }: Props) {
  const [zoomId, setZoomId] = useState('')
  const [viewers, setViewers] = useState(viewerCount?.toString() ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleLink() {
    startTransition(async () => {
      const result = await linkZoomWebinar(webinarId, zoomId)
      setMessage(result.error ?? 'Webinar vinculado a Zoom.')
    })
  }

  async function handleUnlink() {
    if (!confirm('¿Desvincular este webinar de Zoom?')) return
    startTransition(async () => {
      const result = await unlinkZoomWebinar(webinarId)
      setMessage(result.error ?? 'Desvinculado.')
    })
  }

  async function handleSync() {
    startTransition(async () => {
      const res = await fetch(`/api/zoom/sync/${webinarId}`, { method: 'POST' })
      const data = (await res.json()) as { imported?: number; skipped?: number; error?: string }
      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage(`Sync completo: ${data.imported ?? 0} importados, ${data.skipped ?? 0} omitidos.`)
      }
    })
  }

  async function handleViewerCount() {
    const n = Number(viewers)
    if (isNaN(n)) { setMessage('Número inválido'); return }
    startTransition(async () => {
      const result = await updateViewerCount(webinarId, n)
      setMessage(result.error ?? 'Métricas guardadas.')
    })
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 space-y-5">
      {/* Zoom section */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Zoom
        </h3>

        {!zoomConnected && (
          <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            Zoom no está conectado.{' '}
            <a href="/crm/configuracion/integraciones" className="underline">
              Conectar
            </a>
          </p>
        )}

        {zoomConnected && (
          <>
            {zoomWebinarId ? (
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                <Link2 className="h-4 w-4 text-indigo-500" />
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {zoomWebinarId}
                </span>
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={isPending}
                  className="ml-auto text-gray-400 hover:text-red-500"
                  title="Desvincular"
                >
                  <Unlink className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="ID del webinar en Zoom"
                  value={zoomId}
                  onChange={(e) => setZoomId(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleLink}
                  disabled={isPending || !zoomId.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  Vincular
                </button>
              </div>
            )}

            {zoomWebinarId && (
              <button
                type="button"
                onClick={handleSync}
                disabled={isPending}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar desde Zoom
              </button>
            )}
          </>
        )}
      </div>

      {/* Streamyard metrics */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Streamyard — Espectadores
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="0"
            value={viewers}
            onChange={(e) => setViewers(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleViewerCount}
            disabled={isPending}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </div>

      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep "ZoomLinkPanel"
```

Expected: sin output.

- [ ] **Step 3: Commit**

```bash
git add app/crm/webinars/[id]/_components/ZoomLinkPanel.tsx
git commit -m "feat(webinars): add ZoomLinkPanel with sync and Streamyard metrics"
```

---

## Task 8: Integrar ZoomLinkPanel en la página de detalle del webinar

**Files:**
- Modify: `app/crm/webinars/[id]/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

Abrir y leer `app/crm/webinars/[id]/page.tsx` para entender la estructura actual.

- [ ] **Step 2: Agregar query de integration y zoomConnected**

En la función `default async function`, después de obtener el webinar, agregar:

```typescript
const zoomIntegration = await prisma.integration.findUnique({
  where: { provider: 'ZOOM' },
  select: { status: true },
})
const zoomConnected = zoomIntegration?.status === 'ACTIVE'
const zoomWebinarId = webinar.integration?.externalId ?? null
```

- [ ] **Step 3: Agregar ZoomLinkPanel al JSX**

En el layout de la página (después de las estadísticas o en una segunda columna), agregar:

```tsx
import { ZoomLinkPanel } from './_components/ZoomLinkPanel'

// Dentro del JSX, al final del contenido principal:
<ZoomLinkPanel
  webinarId={webinar.id}
  zoomWebinarId={zoomWebinarId}
  viewerCount={webinar.viewerCount}
  zoomConnected={zoomConnected}
/>
```

Asegurar que la query del webinar incluya `integration`:

```typescript
const webinar = await prisma.webinar.findUnique({
  where: { id: webinarId, deletedAt: null },
  include: {
    registrations: {
      include: { contact: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    },
    integration: true,
  },
})
```

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build exits 0.

- [ ] **Step 5: Commit**

```bash
git add app/crm/webinars/[id]/page.tsx
git commit -m "feat(webinars): integrate ZoomLinkPanel in webinar detail page"
```

---

## Task 9: Página de Integraciones (ADMIN)

**Files:**
- Create: `app/crm/configuracion/integraciones/page.tsx`
- Create: `app/crm/configuracion/integraciones/actions.ts`
- Modify: `app/crm/configuracion/page.tsx`

- [ ] **Step 1: Crear actions de integración**

```typescript
// app/crm/configuracion/integraciones/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { IntegrationProvider } from '@prisma/client'

export async function disconnectIntegration(
  provider: IntegrationProvider,
): Promise<{ error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { error: 'No autorizado' }

  try {
    await prisma.integration.delete({ where: { provider } })
  } catch {
    // P2025 = not found — already disconnected
  }

  revalidatePath('/crm/configuracion/integraciones')
  return {}
}
```

- [ ] **Step 2: Crear página de integraciones**

```typescript
// app/crm/configuracion/integraciones/page.tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { DisconnectButton } from './_components/DisconnectButton'

export default async function IntegracionesPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/crm')

  const integrations = await prisma.integration.findMany({
    select: { provider: true, status: true, lastSyncAt: true, updatedAt: true },
  })

  const byProvider = Object.fromEntries(integrations.map((i) => [i.provider, i]))

  const zoomConnected = byProvider['ZOOM']?.status === 'ACTIVE'
  const zoomError = byProvider['ZOOM']?.status === 'ERROR'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Integraciones</h1>

      <div className="space-y-4">
        {/* Zoom */}
        <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
              Z
            </div>
            <div>
              <p className="font-semibold text-gray-900">Zoom</p>
              <p className="text-xs text-gray-500">
                {zoomConnected
                  ? `Conectado · Última sync: ${byProvider['ZOOM']?.lastSyncAt ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(byProvider['ZOOM'].lastSyncAt)) : 'nunca'}`
                  : zoomError
                  ? 'Error en la conexión'
                  : 'No conectado'}
              </p>
            </div>
            {zoomConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
            {zoomError && <AlertCircle className="h-5 w-5 text-yellow-500" />}
            {!byProvider['ZOOM'] && <XCircle className="h-5 w-5 text-gray-300" />}
          </div>

          <div className="flex gap-2">
            {!zoomConnected ? (
              <a
                href="/api/zoom/oauth/start"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Conectar
              </a>
            ) : (
              <DisconnectButton provider="ZOOM" />
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Más integraciones disponibles próximamente: Stripe, SMTP, WhatsApp.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Crear DisconnectButton**

```typescript
// app/crm/configuracion/integraciones/_components/DisconnectButton.tsx
'use client'

import { useTransition } from 'react'
import type { IntegrationProvider } from '@prisma/client'
import { disconnectIntegration } from '../actions'

export function DisconnectButton({ provider }: { provider: IntegrationProvider }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`¿Desconectar ${provider}? Los webinars vinculados perderán su integración.`)) return
    startTransition(async () => {
      await disconnectIntegration(provider)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
    >
      {isPending ? 'Desconectando...' : 'Desconectar'}
    </button>
  )
}
```

- [ ] **Step 4: Actualizar configuracion/page.tsx con links**

Reemplazar el placeholder de `app/crm/configuracion/page.tsx`:

```typescript
import Link from 'next/link'

export default function ConfiguracionPage() {
  const sections = [
    { href: '/crm/configuracion/usuarios', label: 'Usuarios', description: 'Gestiona usuarios y roles del CRM.' },
    { href: '/crm/configuracion/etiquetas', label: 'Etiquetas', description: 'Crea y administra etiquetas de contactos.' },
    { href: '/crm/configuracion/integraciones', label: 'Integraciones', description: 'Conecta Zoom, Stripe, SMTP y más.' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Configuración</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-indigo-300 transition"
          >
            <p className="font-semibold text-gray-900">{s.label}</p>
            <p className="mt-1 text-sm text-gray-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build exits 0.

- [ ] **Step 6: Commit**

```bash
git add app/crm/configuracion/integraciones/ app/crm/configuracion/page.tsx
git commit -m "feat(integrations): add Zoom integrations settings page (ADMIN)"
```

---

## Task 10: Verificación Final

- [ ] **Step 1: Lint**

```bash
npm run lint 2>&1 | tail -20
```

Expected: 0 errores.

- [ ] **Step 2: Build producción**

```bash
npm run build
```

Expected: sale sin errores.

- [ ] **Step 3: Verificar que no hay `input type="date"` en código nuevo**

```bash
grep -rn 'type="date"\|type="time"\|type="datetime-local"' app/api/zoom app/crm/configuracion/integraciones app/crm/webinars/[id]/_components/ZoomLinkPanel.tsx
```

Expected: sin output.

- [ ] **Step 4: Checklist manual (con dev server)**

```bash
npm run dev
```

Verificar en navegador:
- `/crm/configuracion` muestra tarjetas: Usuarios, Etiquetas, Integraciones.
- `/crm/configuracion/integraciones` (solo ADMIN) muestra Zoom como "No conectado" y botón "Conectar".
- Click "Conectar" redirige a Zoom OAuth (requiere credenciales reales para flujo completo).
- `/crm/webinars/[id]` muestra el panel `ZoomLinkPanel` con sección Zoom y Streamyard.
- Campo de espectadores Streamyard se puede llenar y guardar.
- Si Zoom no está conectado, el panel muestra aviso con link a configuración.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat(sprint5): complete Zoom integration + Streamyard metrics"
```

---

## Self-Review

### Spec coverage

| Requisito ROADMAP Sprint 5          | Tarea                                  |
|-------------------------------------|----------------------------------------|
| CRUD Webinar                        | ✅ ya estaba implementado              |
| UI conexión OAuth Zoom (ADMIN)      | ✅ Task 4 + Task 9                     |
| Sync de registrants (manual)        | ✅ Task 5 (`/api/zoom/sync/[id]`)      |
| Sync de registrants (cron)          | ⚠️ fuera de scope MVP (no hay infra de cron en Vercel sin plan Pro) |
| Webhook Zoom (asistencia)           | ✅ Task 5 (`/api/zoom/webhook`)         |
| Streamyard: registro manual métricas| ✅ Task 7 + Task 6 (`viewerCount`)     |

> **Nota cron:** El cron de Zoom está fuera de scope en este plan. La alternativa MVP es el botón de sync manual en `ZoomLinkPanel`. Si se necesita cron, implementarlo en Sprint 10 con Vercel Cron Jobs o con la skill `schedule`.

### Placeholder scan

- Sin "TBD", "TODO", "similar to".
- Todos los steps con código concreto.

### Type consistency

- `linkZoomWebinar(webinarId: number, zoomWebinarId: string)` — definido en Task 6, usado en Task 7. ✅
- `unlinkZoomWebinar(webinarId: number)` — Task 6 + Task 7. ✅
- `updateViewerCount(webinarId: number, viewerCount: number)` — Task 6 + Task 7. ✅
- `disconnectIntegration(provider: IntegrationProvider)` — Task 9. ✅
- `ZoomLinkPanel` props: `webinarId`, `zoomWebinarId`, `viewerCount`, `zoomConnected` — Task 7, pasados en Task 8. ✅
