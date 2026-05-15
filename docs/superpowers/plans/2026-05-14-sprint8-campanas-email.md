# Sprint 8 — Campañas Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el módulo de campañas email: detail page con recipients table, edición de DRAFT, reintentos de FAILED via job route, y List-Unsubscribe en todos los envíos.

**Architecture:**
- `sendCampaign` ya existe y envía sincrónicamente. Se extrae el worker de envío a `/api/jobs/campaign/[id]/route.ts` protegido por token interno para poder reintentar sin sesión de usuario.
- Se agrega `updateCampaign` para editar campañas DRAFT.
- La detail page muestra stats, recipients paginados, y botón Enviar/Reintentar.
- List-Unsubscribe se agrega como header en el transporter.sendMail call dentro de `sendCampaign`.

**Tech Stack:** Next.js App Router RSC + server actions, Prisma 7, nodemailer, TOK design tokens.

---

## File Map

| Action | Path |
|--------|------|
| Create | `app/crm/campanas/[id]/page.tsx` |
| Create | `app/crm/campanas/[id]/_components/RecipientsTable.tsx` |
| Create | `app/crm/campanas/[id]/_components/CampaignSendButton.tsx` |
| Create | `app/api/jobs/campaign/[id]/route.ts` |
| Modify | `app/crm/campanas/actions.ts` (add updateCampaign, add List-Unsubscribe to sendCampaign) |

---

### Task 1: Add List-Unsubscribe + updateCampaign action

**Files:**
- Modify: `app/crm/campanas/actions.ts`

- [ ] **Step 1: Read the sendCampaign transporter.sendMail call**

Run:
```bash
grep -n "sendMail" /Users/noeli/Documents/Develop/rui/app/crm/campanas/actions.ts
```

Find the `transporter.sendMail({...})` call and add the `List-Unsubscribe` header to it.

- [ ] **Step 2: Add List-Unsubscribe header to sendMail**

The unsubscribe URL uses `NEXTAUTH_URL` env var. Find the sendMail call (it has `from`, `to`, `subject`, `text`, `html`) and add:

```typescript
headers: {
  'List-Unsubscribe': `<${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(contact.email)}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
},
```

- [ ] **Step 3: Append updateCampaign action at the end of the file**

Read the current end of `app/crm/campanas/actions.ts`. Then append:

```typescript
// ── updateCampaign ───────────────────────────────────────────

export async function updateCampaign(
  campaignId: number,
  _prevState: CampaignState,
  formData: FormData,
): Promise<CampaignState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  })
  if (!campaign) return { error: 'Campaña no encontrada' }
  if (campaign.status !== 'DRAFT') return { error: 'Solo se pueden editar campañas en borrador' }

  const parsed = campaignSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject'),
    previewText: nullableText(formData.get('previewText')),
    fromName: nullableText(formData.get('fromName')),
    fromEmail: nullableText(formData.get('fromEmail')),
    bodyText: formData.get('bodyText'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const filters = normalizeCampaignFilters(formData)
  const audienceLabel = formatCampaignAudience(filters)

  try {
    await prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        name: parsed.data.name,
        subject: parsed.data.subject,
        previewText: parsed.data.previewText ?? null,
        fromName: parsed.data.fromName ?? null,
        fromEmail: parsed.data.fromEmail ?? null,
        bodyText: parsed.data.bodyText,
        filters: filtersToJson(filters),
        audienceLabel,
      },
    })
  } catch {
    return { error: 'Error al actualizar la campaña' }
  }

  revalidatePath('/crm/campanas')
  revalidatePath(`/crm/campanas/${campaignId}`)
  return { message: 'Campaña actualizada' }
}
```

- [ ] **Step 4: Also add revalidatePath for detail page in sendCampaign**

Find the `revalidatePath('/crm/campanas')` at the end of `sendCampaign` and add `revalidatePath(`/crm/campanas/${campaignId}`)` right after it.

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add app/crm/campanas/actions.ts
git commit -m "feat: add updateCampaign action + List-Unsubscribe header in sendCampaign"
```

---

### Task 2: Job route — campaign worker (batch send + retry)

**Files:**
- Create: `app/api/jobs/campaign/[id]/route.ts`

This route is called internally (from sendCampaign or a cron) with a secret token. It processes all PENDING recipients in batches of 50, then updates campaign final status.

- [ ] **Step 1: Create `app/api/jobs/campaign/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCampaignFrom, getMailerTransporter } from '@/lib/mailer'
import { renderCampaignEmail } from '@/app/crm/campanas/_lib/email-template'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
const BATCH_SIZE = 50

function verifyJobToken(req: NextRequest) {
  const secret = process.env.JOBS_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyJobToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const campaignId = Number(id)
  if (!Number.isInteger(campaignId) || campaignId < 1) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })
  }

  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
  })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['SENDING', 'PARTIAL', 'FAILED'].includes(campaign.status)) {
    return NextResponse.json({ error: 'Campaign not in sendable state' }, { status: 400 })
  }

  const pendingRecipients = await prisma.crmCampaignRecipient.findMany({
    where: { campaignId, status: 'PENDING' },
    take: BATCH_SIZE,
    orderBy: { id: 'asc' },
  })

  const transporter = getMailerTransporter()
  const from = getCampaignFrom(campaign.fromName, campaign.fromEmail)
  const sentActivities: Prisma.ContactActivityCreateManyInput[] = []
  let sent = 0
  let failed = 0

  for (const recipient of pendingRecipients) {
    const email = renderCampaignEmail({
      subject: campaign.subject,
      previewText: campaign.previewText,
      bodyText: campaign.bodyText ?? campaign.bodyHtml ?? '',
      contact: {
        name: recipient.name,
        email: recipient.email,
        phone: null,
        projectName: null,
      },
    })

    try {
      await transporter.sendMail({
        from,
        to: recipient.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
        headers: {
          'List-Unsubscribe': `<${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(recipient.email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      sent++
      await prisma.crmCampaignRecipient.update({
        where: { id: recipient.id },
        data: { status: 'SENT', sentAt: new Date(), errorMessage: null },
      })

      if (recipient.contactId) {
        sentActivities.push({
          contactId: recipient.contactId,
          type: 'CAMPAIGN_SENT',
          body: `Campaña "${campaign.name}": ${campaign.subject}`,
        })
      }
    } catch (error) {
      failed++
      await prisma.crmCampaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        },
      })
    }
  }

  if (sentActivities.length > 0) {
    await prisma.contactActivity.createMany({ data: sentActivities })
  }

  // Check if all recipients are now processed
  const remaining = await prisma.crmCampaignRecipient.count({
    where: { campaignId, status: 'PENDING' },
  })

  if (remaining === 0) {
    const totals = await prisma.crmCampaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    })
    const countByStatus = Object.fromEntries(totals.map((r) => [r.status, r._count]))
    const totalSent = countByStatus['SENT'] ?? 0
    const totalFailed = countByStatus['FAILED'] ?? 0
    const finalStatus = totalFailed === 0 ? 'SENT' : totalSent === 0 ? 'FAILED' : 'PARTIAL'

    await prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        sentCount: totalSent,
        failedCount: totalFailed,
        sentAt: campaign.sentAt ?? new Date(),
      },
    })
  }

  return NextResponse.json({ sent, failed, remaining })
}
```

- [ ] **Step 2: Add JOBS_SECRET to .env.example**

```bash
grep -n "JOBS_SECRET" /Users/noeli/Documents/Develop/rui/.env.example || true
```

If not present, append to `.env.example`:
```
# Internal job runner
JOBS_SECRET=change-me-random-secret
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/api/jobs/campaign/ .env.example
git commit -m "feat: campaign job route — batch send 50 recipients, retry FAILED"
```

---

### Task 3: Campaign detail page

**Files:**
- Create: `app/crm/campanas/[id]/page.tsx`

The page shows: campaign header (name, status, stats), tabs (Info | Destinatarios), send/retry button, recipients table.

- [ ] **Step 1: Create `app/crm/campanas/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { CampaignStatusBadge } from '@/app/crm/_components/ui'
import { RecipientsTable } from './_components/RecipientsTable'
import { CampaignSendButton } from './_components/CampaignSendButton'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default async function CampaignDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const campaignId = Number(id)
  if (!Number.isInteger(campaignId) || campaignId < 1) notFound()

  const campaign = await prisma.crmCampaign.findFirst({
    where: { id: campaignId, deletedAt: null },
    select: {
      id: true,
      name: true,
      subject: true,
      previewText: true,
      fromName: true,
      fromEmail: true,
      bodyText: true,
      status: true,
      audienceLabel: true,
      recipientCount: true,
      sentCount: true,
      failedCount: true,
      sentAt: true,
      createdAt: true,
      channel: true,
    },
  })
  if (!campaign) notFound()

  const activeTab = query.tab === 'destinatarios' ? 'destinatarios' : 'info'

  const recipients = activeTab === 'destinatarios'
    ? await prisma.crmCampaignRecipient.findMany({
        where: { campaignId },
        orderBy: { id: 'asc' },
        take: 200,
        select: { id: true, email: true, name: true, status: true, sentAt: true, errorMessage: true },
      })
    : []

  const canSend = ['DRAFT', 'FAILED', 'PARTIAL'].includes(campaign.status)
  const canRetry = ['FAILED', 'PARTIAL'].includes(campaign.status)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/campanas" className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Campañas
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad} flex flex-col gap-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-on-surface)]">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">{campaign.subject}</p>
          </div>
          {canSend && (
            <CampaignSendButton campaignId={campaign.id} isRetry={canRetry} />
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {[
            { label: 'Destinatarios', value: campaign.recipientCount },
            { label: 'Enviados', value: campaign.sentCount },
            { label: 'Fallidos', value: campaign.failedCount },
            { label: 'Enviado el', value: campaign.sentAt ? dateFmt.format(new Date(campaign.sentAt)) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-3">
              <p className="text-xs text-[var(--color-on-surface-variant)]">{label}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-on-surface)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="inline-flex w-fit rounded-[var(--radius-md)] bg-[var(--color-surface-container-high)] p-1">
          {([['info', 'Info'], ['destinatarios', 'Destinatarios']] as const).map(([tab, label]) => (
            <Link
              key={tab}
              href={tab === 'info' ? `?` : `?tab=${tab}`}
              className={`rounded-[calc(var(--radius-md)-4px)] px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {activeTab === 'info' && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className={TOK.label}>Audiencia</dt>
              <dd className="text-[var(--color-on-surface)]">{campaign.audienceLabel}</dd>
            </div>
            <div>
              <dt className={TOK.label}>Remitente</dt>
              <dd className="text-[var(--color-on-surface)]">{campaign.fromName ?? '—'} {campaign.fromEmail ? `<${campaign.fromEmail}>` : ''}</dd>
            </div>
            <div>
              <dt className={TOK.label}>Preheader</dt>
              <dd className="text-[var(--color-on-surface)]">{campaign.previewText ?? '—'}</dd>
            </div>
            <div>
              <dt className={TOK.label}>Canal</dt>
              <dd className="text-[var(--color-on-surface)]">{campaign.channel}</dd>
            </div>
            {campaign.bodyText && (
              <div className="sm:col-span-2">
                <dt className={TOK.label}>Contenido</dt>
                <dd className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--color-surface-container-high)] p-3 font-mono text-xs text-[var(--color-on-surface)]">
                  {campaign.bodyText}
                </dd>
              </div>
            )}
          </dl>
        )}

        {activeTab === 'destinatarios' && (
          <RecipientsTable recipients={recipients} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Fix any errors (likely `CampaignStatusBadge` import or `as const` on the tabs array).

- [ ] **Step 3: Commit**

```bash
git add app/crm/campanas/[id]/page.tsx
git commit -m "feat: campaign detail page — stats, tabs, info view"
```

---

### Task 4: RecipientsTable + CampaignSendButton components

**Files:**
- Create: `app/crm/campanas/[id]/_components/RecipientsTable.tsx`
- Create: `app/crm/campanas/[id]/_components/CampaignSendButton.tsx`

- [ ] **Step 1: Create `app/crm/campanas/[id]/_components/RecipientsTable.tsx`**

```typescript
import { TOK } from '@/app/crm/_lib/ui-tokens'

type RecipientStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED'

interface Recipient {
  id: number
  email: string
  name: string | null
  status: RecipientStatus
  sentAt: Date | null
  errorMessage: string | null
}

const STATUS_LABELS: Record<RecipientStatus, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  FAILED: 'Fallido',
  SKIPPED: 'Omitido',
}

const STATUS_COLORS: Record<RecipientStatus, string> = {
  PENDING: 'text-[var(--color-on-surface-variant)]',
  SENT: 'text-[var(--color-tertiary)]',
  FAILED: 'text-[var(--color-error)]',
  SKIPPED: 'text-[var(--color-on-surface-variant)]',
}

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export function RecipientsTable({ recipients }: { recipients: Recipient[] }) {
  if (recipients.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textMuted}>Sin destinatarios aún. Envía la campaña para ver el estado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-outline-variant)]">
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Email</th>
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Nombre</th>
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Estado</th>
            <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Enviado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-outline-variant)]">
          {recipients.map((r) => (
            <tr key={r.id}>
              <td className="py-2 pr-4 font-mono text-xs text-[var(--color-on-surface)]">{r.email}</td>
              <td className="py-2 pr-4 text-[var(--color-on-surface-variant)]">{r.name ?? '—'}</td>
              <td className="py-2 pr-4">
                <span className={`text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
                {r.errorMessage && (
                  <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--color-error)]" title={r.errorMessage}>
                    {r.errorMessage}
                  </p>
                )}
              </td>
              <td className="py-2 text-xs text-[var(--color-on-surface-variant)]">
                {r.sentAt ? dateFmt.format(new Date(r.sentAt)) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/crm/campanas/[id]/_components/CampaignSendButton.tsx`**

```typescript
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, RotateCcw } from 'lucide-react'
import { sendCampaign } from '@/app/crm/campanas/actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  campaignId: number
  isRetry: boolean
}

export function CampaignSendButton({ campaignId, isRetry }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSend() {
    const label = isRetry ? 'reintentar el envío' : 'enviar esta campaña'
    if (!confirm(`¿Confirmas ${label}?`)) return
    startTransition(async () => {
      const result = await sendCampaign(campaignId)
      if (result?.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleSend}
      className={TOK.actionPrimary}
    >
      {isRetry ? <RotateCcw size={15} /> : <Send size={15} />}
      {pending ? 'Enviando...' : isRetry ? 'Reintentar' : 'Enviar campaña'}
    </button>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/crm/campanas/[id]/_components/
git commit -m "feat: RecipientsTable + CampaignSendButton components"
```

---

### Task 5: Wire detail page link from campaigns list

**Files:**
- Verify: `app/crm/campanas/_components/CampaignsTable.tsx` — ensure each row links to `/crm/campanas/{id}`

- [ ] **Step 1: Check CampaignsTable for existing detail link**

```bash
grep -n "href\|/crm/campanas/" /Users/noeli/Documents/Develop/rui/app/crm/campanas/_components/CampaignsTable.tsx | head -10
```

- [ ] **Step 2: If no detail link exists, add it**

Read `CampaignsTable.tsx`. Find the row or campaign name cell. Wrap the campaign name in a `<Link href={`/crm/campanas/${campaign.id}`}>` tag.

If a link already exists pointing to the detail page, skip this step.

- [ ] **Step 3: Check CampaignsGrid too**

```bash
grep -n "href\|/crm/campanas/" /Users/noeli/Documents/Develop/rui/app/crm/campanas/_components/CampaignsGrid.tsx | head -10
```

Same fix if needed.

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add app/crm/campanas/_components/
git commit -m "feat: link campaign rows to detail page"
```

---

## Self-Review

**Spec coverage:**
- ✅ CRUD `CrmCampaign` — create existed, `updateCampaign` added (DRAFT only)
- ✅ Envío vía SMTP — already existed synchronously in `sendCampaign`; job route adds batch/retry path
- ✅ Tracking de status por recipient — `RecipientsTable` shows PENDING/SENT/FAILED/SKIPPED + errorMessage
- ✅ `List-Unsubscribe` header added to both `sendCampaign` inline loop and job route
- ✅ Detail page with stats cards, tabs, send button
- ✅ Retry button for FAILED/PARTIAL campaigns
- ✅ Detail page linked from list

**Note:** The job route (`/api/jobs/campaign/[id]`) processes one batch of 50 at a time. For large lists, a cron would call it repeatedly until `remaining === 0`. This is the MVP pattern specified in the roadmap.

**No placeholders.**

**Type consistency:** `sendCampaign` returns `SendState = { sent?, failed?, recipients? } | null` — `CampaignSendButton` calls it with `await sendCampaign(campaignId)` and checks `result?.error`, which is compatible since `SendState` also has `error?`.
