# Skill: module-sales-stripe

## Alcance
`/crm/ventas` + integración Stripe (Checkout + webhook).

## Pre-lectura
- `sdd-loader`, `zod-validator`, `role-guard`, `audit-logger`.
- `docs/sdd/INTEGRATIONS.md §1`.

## Estructura
```
app/crm/ventas/
  page.tsx
  nueva/page.tsx
  [id]/page.tsx
  _components/
    SalesTable.tsx
    SalesFilters.tsx
    SaleForm.tsx
    RefundDialog.tsx
    CheckoutLauncher.tsx
app/api/stripe/webhook/route.ts
lib/services/sales.ts
lib/integrations/stripe.ts
lib/validators/sales.ts
```

## Server actions
- `listSales(filters)`, `getSale(id)`.
- `createManualSale(input)`.
- `markRefund(id, reason)`.
- `createCheckoutSession({productName, amountCents, contactId, dealId?})`.
- `recordSaleFromStripe(payload)` (interno).

## Webhook
`POST /api/stripe/webhook`:
1. Leer raw body (`req.text()`), no parsear antes.
2. Verificar firma con `stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)`.
3. Idempotencia: insertar `StripeEvent` con `eventId` (unique). Si conflict → skip (200 OK).
4. Switch por `event.type`:
   - `checkout.session.completed` → `recordSaleFromStripe` → status PAID, Contact a CLIENT, ContactActivity `COURSE_PURCHASED`, AuditLog.
   - `charge.refunded` → marcar venta `REFUNDED`.
   - `payment_intent.payment_failed` → si existe venta pending → notas.
5. Marcar `processedAt`.
6. Responder 200.

## Checkout
- `createCheckoutSession`:
  - `mode: "payment"`.
  - `line_items` con `price_data`.
  - `metadata: { contactId, dealId }`.
  - `success_url`, `cancel_url` con query params.
- Devuelve URL → cliente redirige.

## Reglas
- Venta `PAID` (cualquier origen) → Contact.status = CLIENT.
- Refund NO devuelve a NEW/QUALIFIED automáticamente.
- Importes en `amountCents` (integer). UI muestra con formato MXN.

## Testing
- Unit: idempotencia (mismo eventId dos veces), firma inválida → 400.
- E2E (Stripe CLI): trigger `checkout.session.completed` → venta creada.

## Done
- Webhook idempotente.
- Firma verificada SIEMPRE.
- Logs sin tokens ni emails completos del payload.
