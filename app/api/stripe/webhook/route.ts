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
        payload: JSON.parse(JSON.stringify(event)),
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
