# Sprint 6 — Stripe + Ventas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Stripe Checkout into the CRM so deals can generate payment links and webhook events automatically create/refund sales, keeping Contact status in sync.

**Architecture:** Stripe singleton in `lib/integrations/stripe.ts`; business logic in `lib/services/sales.ts`; idempotent webhook at `/api/stripe/webhook/route.ts`; `CheckoutLauncher` client component on the deal detail page; `markRefund` and `createCheckoutSession` as server actions in `app/crm/ventas/actions.ts`.

**Note:** `createSale` and `updateSaleStatus` already upgrade Contact→CLIENT when status=PAID. Those paths require no changes.

**Tech Stack:** stripe npm package, Next.js App Router Route Handler (raw body), Prisma 7 + MariaDB, Zod, `lib/integrations/stripe.ts` singleton, server actions.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `.env.example` |
| Create | `lib/integrations/stripe.ts` |
| Create | `lib/services/sales.ts` |
| Create | `app/api/stripe/webhook/route.ts` |
| Modify | `app/crm/ventas/actions.ts` |
| Create | `app/crm/pipeline/[id]/_components/CheckoutLauncher.tsx` |
| Modify | `app/crm/pipeline/[id]/page.tsx` |

---

### Task 1: Install stripe + add env vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.example`

- [ ] **Step 1: Install the stripe package**

```bash
cd /Users/noeli/Documents/Develop/rui
npm install stripe
```

Expected: `stripe` appears in `package.json` dependencies.

- [ ] **Step 2: Add env vars to .env.example**

Open `.env.example` and append:

```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:3000/crm/ventas?stripe=success
STRIPE_CANCEL_URL=http://localhost:3000/crm/ventas?stripe=cancel
```

- [ ] **Step 3: Verify package installed**

```bash
node -e "require('stripe'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install stripe, add env var placeholders"
```

---

### Task 2: Stripe singleton client

**Files:**
- Create: `lib/integrations/stripe.ts`

- [ ] **Step 1: Create the singleton**

Create `lib/integrations/stripe.ts`:

```typescript
import Stripe from 'stripe'

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(key)
}

let _client: Stripe | null = null

export function stripe(): Stripe {
  if (!_client) _client = getStripeClient()
  return _client
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add lib/integrations/stripe.ts
git commit -m "feat: add stripe singleton client"
```

---

### Task 3: Sales service — recordSaleFromStripe + createCheckoutSession

**Files:**
- Create: `lib/services/sales.ts`

- [ ] **Step 1: Create the service**

Create `lib/services/sales.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/integrations/stripe'
import type Stripe from 'stripe'

export interface CheckoutInput {
  productName: string
  amountCents: number
  currency?: string
  contactId: number
  dealId?: number
}

export async function createCheckoutSession(input: CheckoutInput): Promise<string> {
  const { productName, amountCents, currency = 'MXN', contactId, dealId } = input

  const successUrl = process.env.STRIPE_SUCCESS_URL ?? `${process.env.NEXTAUTH_URL}/crm/ventas`
  const cancelUrl = process.env.STRIPE_CANCEL_URL ?? `${process.env.NEXTAUTH_URL}/crm/ventas`

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: amountCents,
          product_data: { name: productName },
        },
        quantity: 1,
      },
    ],
    metadata: {
      contactId: String(contactId),
      dealId: dealId != null ? String(dealId) : '',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return session.url
}

export async function recordSaleFromStripe(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const contactId = Number(session.metadata?.contactId)
  const dealId = session.metadata?.dealId ? Number(session.metadata.dealId) : undefined
  const amountCents = session.amount_total ?? 0
  const currency = (session.currency ?? 'mxn').toUpperCase()
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null
  const customer =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  if (!contactId) {
    console.warn('[stripe] checkout.session.completed missing contactId metadata')
    return
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.crmSale.create({
      data: {
        contactId,
        dealId: dealId ?? null,
        productName: session.metadata?.productName ?? 'Stripe Checkout',
        amountCents,
        currency,
        status: 'PAID',
        paymentMethod: 'STRIPE',
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntent,
        stripeCustomerId: customer,
        soldAt: new Date(),
      },
      select: { id: true },
    })

    await tx.contactActivity.create({
      data: {
        contactId,
        type: 'COURSE_PURCHASED',
        body: `Compra vía Stripe · Venta #${sale.id} · ${(amountCents / 100).toFixed(2)} ${currency}`,
      },
    })

    await tx.contact.update({
      where: { id: contactId },
      data: { status: 'CLIENT' },
    })

    if (dealId) {
      await tx.deal.update({
        where: { id: dealId },
        data: { stage: 'ENROLLED' },
      })
    }
  })
}

export async function applyStripeRefund(sessionId: string): Promise<void> {
  const sale = await prisma.crmSale.findFirst({
    where: { stripeSessionId: sessionId },
    select: { id: true, contactId: true },
  })
  if (!sale) return

  await prisma.crmSale.update({
    where: { id: sale.id },
    data: { status: 'REFUNDED' },
  })

  await prisma.contactActivity.create({
    data: {
      contactId: sale.contactId,
      type: 'NOTE',
      body: `Reembolso Stripe · Venta #${sale.id}`,
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add lib/services/sales.ts
git commit -m "feat: sales service — recordSaleFromStripe, createCheckoutSession, applyStripeRefund"
```

---

### Task 4: Stripe webhook route

**Files:**
- Create: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/integrations/stripe'
import { prisma } from '@/lib/prisma'
import { recordSaleFromStripe, applyStripeRefund } from '@/lib/services/sales'

export const runtime = 'nodejs'

// Must read raw body BEFORE any JSON parse — Stripe signature verification requires it.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(rawBody, sig ?? '', webhookSecret)
  } catch (err) {
    console.warn('[stripe] invalid signature:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency: store event, skip if already processed.
  try {
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
      },
    })
  } catch {
    // Unique constraint violation = duplicate delivery. Ack and skip.
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await recordSaleFromStripe(session)
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const piId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id ?? null
        if (piId) {
          const sale = await prisma.crmSale.findFirst({
            where: { stripePaymentIntentId: piId },
            select: { id: true, stripeSessionId: true },
          })
          if (sale?.stripeSessionId) {
            await applyStripeRefund(sale.stripeSessionId)
          }
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.info('[stripe] payment_intent.payment_failed pi=', pi.id)
        break
      }
      default:
        break
    }

    await prisma.stripeEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    })
  } catch (err) {
    console.error('[stripe] error processing event', event.type, err)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: stripe webhook route — idempotent, sig-verified, handles checkout/refund"
```

---

### Task 5: markRefund + createCheckoutSession server actions

**Files:**
- Modify: `app/crm/ventas/actions.ts`

- [ ] **Step 1: Read the current file**

Read `app/crm/ventas/actions.ts` (already done in plan prep; it ends at line ~165 with `deleteSale`).

- [ ] **Step 2: Add markRefund and createCheckoutSession at the end of the file**

Append to `app/crm/ventas/actions.ts` after the `deleteSale` export:

```typescript
export async function markRefund(saleId: number): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  try {
    const sale = await prisma.crmSale.update({
      where: { id: saleId },
      data: { status: 'REFUNDED' },
      select: { contactId: true },
    })

    await prisma.contactActivity.create({
      data: {
        contactId: sale.contactId,
        type: 'NOTE',
        body: `Reembolso registrado · Venta #${saleId}`,
        createdById: Number(session.user.id),
      },
    })

    revalidateSalesPaths(sale.contactId)
  } catch {
    return { error: 'Error al registrar el reembolso' }
  }

  return {}
}

export async function createCheckoutSessionAction(
  _prevState: SaleState,
  formData: FormData,
): Promise<SaleState & { url?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const contactId = Number(formData.get('contactId'))
  const dealId = Number(formData.get('dealId')) || undefined
  const productName = (formData.get('productName') as string | null)?.trim()
  const rawAmount = formData.get('amount') as string | null
  const amountCents = normalizeMoneyInput(rawAmount ?? '')

  if (!contactId || contactId < 1) return { error: 'Contacto inválido' }
  if (!productName || productName.length < 2) return { error: 'Nombre de producto inválido' }
  if (!amountCents || amountCents < 1) return { error: 'Monto inválido' }

  try {
    const { createCheckoutSession } = await import('@/lib/services/sales')
    const url = await createCheckoutSession({ productName, amountCents, contactId, dealId })
    return { url }
  } catch (err) {
    console.error('[checkout] error creating session', err)
    return { error: 'Error al crear la sesión de pago' }
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/crm/ventas/actions.ts
git commit -m "feat: add markRefund and createCheckoutSessionAction server actions"
```

---

### Task 6: CheckoutLauncher component on deal detail

**Files:**
- Create: `app/crm/pipeline/[id]/_components/CheckoutLauncher.tsx`
- Modify: `app/crm/pipeline/[id]/page.tsx`

- [ ] **Step 1: Create CheckoutLauncher**

Create `app/crm/pipeline/[id]/_components/CheckoutLauncher.tsx`:

```typescript
'use client'

import { useActionState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { createCheckoutSessionAction } from '@/app/crm/ventas/actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  contactId: number
  dealId: number
  defaultProductName?: string
}

export function CheckoutLauncher({ contactId, dealId, defaultProductName }: Props) {
  const [state, action, pending] = useActionState(createCheckoutSessionAction, null)

  useEffect(() => {
    if (state?.url) {
      window.open(state.url, '_blank', 'noopener,noreferrer')
    }
  }, [state?.url])

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="dealId" value={dealId} />

      <div>
        <label className={TOK.label}>Producto</label>
        <input
          name="productName"
          required
          minLength={2}
          defaultValue={defaultProductName ?? ''}
          placeholder="Nombre del curso o producto"
          className={TOK.inputNative}
        />
      </div>

      <div>
        <label className={TOK.label}>Monto (MXN)</label>
        <input
          name="amount"
          required
          type="text"
          inputMode="decimal"
          placeholder="1500.00"
          className={TOK.inputNative}
        />
      </div>

      {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
      {state?.url && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
          Enlace abierto en nueva pestaña.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${TOK.actionAccent} w-full justify-center`}
      >
        <ExternalLink size={15} />
        {pending ? 'Generando enlace...' : 'Generar enlace de pago'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Add CheckoutLauncher to deal detail page**

In `app/crm/pipeline/[id]/page.tsx`, add the import at the top with the other component imports:

```typescript
import { CheckoutLauncher } from './_components/CheckoutLauncher'
```

Then inside the JSX, after the closing `</div>` of the "Ventas vinculadas" Accordion card (the second grid card), add a third card:

```typescript
<div className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-4">
  <p className={`mb-3 ${TOK.label}`}>Generar pago con Stripe</p>
  <CheckoutLauncher
    contactId={deal.contactId}
    dealId={deal.id}
    defaultProductName={deal.courseName ?? ''}
  />
</div>
```

The grid around the two info cards should expand to `sm:grid-cols-2` or be converted to `grid-cols-1` with full-width cards — simply change from `grid gap-4 sm:grid-cols-2` to `grid gap-4` so all three cards stack full-width. Or keep the 2-col grid and make the checkout card span full width:

```typescript
<div className="grid gap-4">
  {/* card 1: contacto */}
  {/* card 2: ventas */}
  {/* card 3: checkout */}
</div>
```

The exact edit: find `<div className="grid gap-4 sm:grid-cols-2">` and change it to `<div className="grid gap-4">`, then add the CheckoutLauncher card after the ventas card.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/crm/pipeline/[id]/_components/CheckoutLauncher.tsx app/crm/pipeline/[id]/page.tsx
git commit -m "feat: CheckoutLauncher on deal detail — generates Stripe payment link"
```

---

## Self-Review

**Spec coverage:**
- ✅ Raw body before JSON parse (Task 4, `req.text()`)
- ✅ Signature verification (`stripe().webhooks.constructEvent`)
- ✅ Idempotency via `StripeEvent.eventId` unique constraint
- ✅ `checkout.session.completed` → `recordSaleFromStripe` → Contact=CLIENT → `COURSE_PURCHASED` activity
- ✅ `charge.refunded` → `applyStripeRefund` → sale REFUNDED
- ✅ `payment_intent.payment_failed` → log only
- ✅ `createCheckoutSession` with mode=payment, price_data, metadata `{contactId, dealId}`
- ✅ `amountCents` integer throughout, never floats
- ✅ Logs don't include full emails or tokens
- ✅ `markRefund` server action for manual refunds
- ✅ CheckoutLauncher on deal detail
- ✅ `.env.example` updated

**No placeholders found.**

**Type consistency:** `recordSaleFromStripe` takes `Stripe.Checkout.Session`, `applyStripeRefund` takes `sessionId: string` — consistent across webhook route and service. `createCheckoutSessionAction` uses `normalizeMoneyInput` already imported in the file.
