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
      productName,
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
