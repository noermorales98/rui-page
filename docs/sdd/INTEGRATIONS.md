# INTEGRATIONS — CRM Rui

## 1. Stripe

### 1.1 Modo
- Checkout Sessions (no PaymentIntents directos).
- Webhook centralizado en `/api/stripe/webhook`.
- Idempotencia vía tabla `StripeEvent` (unique `eventId`).

### 1.2 Variables de entorno
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_DEFAULT=  # opcional
```

### 1.3 Eventos a manejar
- `checkout.session.completed` → crear/actualizar `CrmSale` con `status=PAID`, `stripeSessionId`, `stripePaymentIntentId`. Disparar `addActivity(COURSE_PURCHASED)`. Subir Contact a `CLIENT`.
- `charge.refunded` → marcar `CrmSale.status=REFUNDED`.
- `payment_intent.payment_failed` → marcar `PENDING` con nota.

### 1.4 Flujo creación pago
- UI server action `createCheckoutSession(productName, amountCents, contactId)` → Stripe → URL → redirect.
- `success_url`: `/crm/ventas?stripe=success`.
- `cancel_url`: `/crm/ventas?stripe=cancel`.

## 2. SMTP (email)

### 2.1 Lib
Nodemailer (ya instalado).

### 2.2 Variables
```
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=
SMTP_SECURE=true
```

### 2.3 Uso
- Transporter único en `lib/integrations/smtp.ts`.
- Función `sendEmail({to, subject, html, text, headers})`.
- Reintentos: 3 con backoff exponencial.
- Si campaña: cada destinatario falla → actualizar `CrmCampaignRecipient.status=FAILED` + `errorMessage`.

### 2.4 Reglas
- Header `List-Unsubscribe` siempre presente.
- Tracking de open/click: NO en MVP (privacidad + complejidad).

## 3. WhatsApp Cloud API (Meta)

### 3.1 Por qué
Más barato, oficial, sin intermediario. Funciona bien para volumen bajo-medio.

### 3.2 Variables
```
WA_PHONE_NUMBER_ID=
WA_ACCESS_TOKEN=
WA_VERIFY_TOKEN=
WA_APP_SECRET=
```

### 3.3 Envío
- Endpoint Meta: `POST https://graph.facebook.com/v20.0/{phone_number_id}/messages`.
- En campañas: usar `type: "template"` con `waTemplateName` y variables.
- En 1:1 (futuro): `type: "text"` solo dentro de la ventana de 24h.

### 3.4 Webhook `/api/whatsapp/webhook`
- GET: verifica `hub.challenge` con `WA_VERIFY_TOKEN`.
- POST: valida firma `X-Hub-Signature-256` con `WA_APP_SECRET`.
- Procesa: `messages` (inbound), `statuses` (entrega/lectura). Actualiza `CrmCampaignRecipient` cuando aplique.

### 3.5 Plantillas
- Se gestionan desde Meta Business Manager (no desde CRM en MVP).
- En CRM: solo se referencia el nombre + idioma + variables.

## 4. Zoom

### 4.1 Modo
- OAuth (apps de cuenta) para acceso del Admin a su cuenta Zoom.
- Token + refresh almacenados cifrados en `Integration.config`.

### 4.2 Variables
```
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=
ZOOM_VERIFICATION_TOKEN=
```

### 4.3 Uso
- Crear webinar en CRM → opcionalmente vincular a un Zoom meeting/webinar existente vía `WebinarIntegration`.
- Cron job sincroniza registrantes y attendance cada N min.
- Webhook `/api/zoom/webhook`:
  - `meeting.participant_joined` → marcar `ATTENDED`.
  - `webinar.registration_created` → crear `WebinarRegistration` + Contact si no existe.

## 5. Streamyard
Manual. No hay API pública estándar. Usuario registra webinar y carga métricas a mano.

## 6. Tabla `Integration`
Estado y config de cada integración en una sola fuente.
```
provider     IntegrationProvider  unique
status       IntegrationStatus
config       Json (cifrado en reposo)
lastSyncAt   DateTime?
```
UI en `/crm/settings/integraciones` — solo ADMIN.

## 7. Manejo de errores externos
- Toda llamada externa: timeout 10s, retry 2 veces.
- Si falla persistente: marcar `Integration.status=ERROR`, notificar al ADMIN en dashboard.
- Webhooks externos siempre responden 200 tras encolar; el procesamiento real puede ser asíncrono.

## 8. Seguridad
- Tokens externos NUNCA en logs.
- `Integration.config` cifrado con clave en env (`INTEGRATION_ENC_KEY`).
- Webhooks: verificación de firma OBLIGATORIA antes de cualquier procesamiento.
