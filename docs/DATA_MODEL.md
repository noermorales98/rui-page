# DATA_MODEL — CRM Rui

> Fuente de verdad del schema. Cualquier cambio se refleja primero aquí, luego en `prisma/schema.prisma`.

## 1. Convenciones
- IDs `Int @id @default(autoincrement())` salvo modelos públicos (formularios) que pueden requerir cuid en futuro.
- Fechas: `createdAt` + `updatedAt` en todas las entidades principales.
- Soft delete: `deletedAt DateTime?` + `@@index([deletedAt])` en entidades principales.
- Texto largo: `@db.Text`.
- Códigos cortos: `@db.VarChar(N)`.
- Monedas: `amountCents Int` + `currency VarChar(3)`.

## 2. Entidades

### 2.1 Auth
- **User** — `id, name, email (unique), password, role(Role), active, deletedAt, createdAt, updatedAt`.
- **Account** — para OAuth Auth.js v5 (provider, providerAccountId, etc).
- **Session** — sessionToken, userId, expires.
- **VerificationToken** — identifier, token, expires.

### 2.2 Contactos
- **Contact** — `id, name, email (required, unique), phone?, source(ContactSource), status(ContactStatus), deletedAt, createdAt, updatedAt`.
- **Tag** — `id, name (unique), color, deletedAt`.
- **ContactTag** — join (contactId, tagId).
- **ContactActivity** — log por contacto: `type(ActivityType), body?, createdById?, createdAt`.

### 2.3 Pipeline & Ventas
- **Deal** — `id, contactId, courseName?, stage(DealStage), notes?, deletedAt`.
- **CrmSale** — `id, contactId, dealId?, productName, amountCents, currency, status(CrmSaleStatus), paymentMethod(CrmPaymentMethod), soldAt, notes?, createdById?, stripeSessionId? (unique), stripePaymentIntentId? (unique), stripeCustomerId?, deletedAt`.
- **StripeEvent** — `id, eventId (unique), type, payload(Json), processedAt?, createdAt`. Idempotencia de webhooks.

### 2.4 Webinars
- **Webinar** — `id, title, date, platform?, link?, description?, deletedAt`.
- **WebinarRegistration** — `webinarId, contactId, status(RegistrationStatus)`. Unique (webinarId, contactId).
- **WebinarIntegration** — ligado a `Integration` (zoom meetingId, etc).

### 2.5 Formularios
- **CrmForm** — `id, name, slug (unique), status(CrmFormStatus), description?, submitLabel, successMessage, createdById?, deletedAt`.
- **CrmFormField** — `id, formId, type(CrmFormFieldType), contactTarget(CrmFormContactTarget), label, fieldKey, placeholder?, helpText?, isRequired, position, config(Json)`. Unique (formId, fieldKey).
  - `config` aloja lógica condicional: `{ "showWhen": { "fieldKey": "x", "op": "eq", "value": "y" } }`.
- **CrmFormSubmission** — `id, formId, contactId?, submittedAt, ipHash?, userAgent?`.
- **CrmFormSubmissionValue** — `submissionId, fieldId, rawValue?, normalizedValue?`. Unique (submissionId, fieldId).

### 2.6 Campañas
- **CrmCampaign** — `id, name, subject, previewText?, fromName?, fromEmail?, bodyHtml @Text, bodyText?, channel(CrmCampaignChannel), status(CrmCampaignStatus), filters(Json)?, segmentId?, templateId?, audienceLabel, projectName?, recipientCount, sentCount, failedCount, sentAt?, createdById?, waTemplateName?, waLanguage?, waVariables(Json)?, deletedAt`.
- **CrmCampaignRecipient** — `campaignId, contactId?, email, name?, status(CrmCampaignRecipientStatus), errorMessage?, sentAt?`. Unique (campaignId, contactId).
- **CampaignTemplate** — `id, name, channel, subject?, previewText?, bodyHtml? @Text, bodyText? @Text, waTemplate?, variables(Json)?, createdById?, deletedAt`.
- **Segment** — `id, name (unique), description?, filters(Json), isDynamic, createdById?, deletedAt`.

### 2.7 Integraciones
- **Integration** — `id, provider(IntegrationProvider, unique), status(IntegrationStatus), config(Json cifrado), lastSyncAt?`.

### 2.8 Auditoría
- **AuditLog** — `id, actorId?, entityType VarChar(64), entityId, action(AuditAction), changes(Json)?, metadata(Json)?, createdAt`.

## 3. Enums
- `Role`: ADMIN, VENDEDOR, ASISTENTE.
- `ContactSource`: WEBINAR, FORM, MANUAL, IMPORT.
- `ContactStatus`: NEW, QUALIFIED, CLIENT.
- `ActivityType`: NOTE, EMAIL_SENT, WEBINAR_REGISTERED, WEBINAR_ATTENDED, COURSE_PURCHASED, FORM_SUBMITTED, CAMPAIGN_SENT, SALE_CREATED.
- `DealStage`: LEAD, DEMO, NEGOTIATION, ENROLLED.
- `CrmSaleStatus`: PENDING, PAID, REFUNDED, CANCELED.
- `CrmPaymentMethod`: CASH, TRANSFER, CARD, STRIPE, PAYPAL, OTHER.
- `CrmCampaignStatus`: DRAFT, SENDING, SENT, PARTIAL, FAILED, ARCHIVED.
- `CrmCampaignChannel`: EMAIL, WHATSAPP.
- `CrmCampaignRecipientStatus`: PENDING, SENT, FAILED, SKIPPED.
- `CrmFormStatus`: DRAFT, PUBLISHED, ARCHIVED.
- `CrmFormFieldType`: SHORT_TEXT, FULL_NAME, PHONE, PHONE_WITH_COUNTRY, EMAIL, CUSTOM_DATE, CUSTOM_TIME, CUSTOM_DATETIME, **HTML_INPUT** (controles genéricos vía `config.html`: `input`/`textarea`/`select`, tipos HTML5, opciones, min/max, etc.).
- `CrmFormContactTarget`: NONE, NAME, EMAIL, PHONE.
- `RegistrationStatus`: REGISTERED, ATTENDED, PURCHASED.
- `IntegrationProvider`: ZOOM, STREAMYARD, STRIPE, WHATSAPP_CLOUD, SMTP.
- `IntegrationStatus`: ACTIVE, DISABLED, ERROR.
- `AuditAction`: CREATE, UPDATE, DELETE, STATUS_CHANGE, STAGE_CHANGE, LOGIN.

## 4. Índices clave
Ya definidos por modelo. Revisión periódica al crecer volumen.

## 5. Migraciones pendientes (desde schema actual)
1. `Role`: EDITOR → migrar a `ASISTENTE`. Crear `VENDEDOR`.
2. Agregar `deletedAt` en entidades principales.
3. `CrmCampaign`: agregar `channel`, `templateId`, `segmentId`, `waTemplateName`, `waLanguage`, `waVariables`. Hacer `bodyHtml` opcional.
4. `CrmSale`: agregar campos Stripe.
5. Crear `StripeEvent`, `Integration`, `WebinarIntegration`, `CampaignTemplate`, `Segment`, `AuditLog`.
6. Crear modelos Auth.js: `Account`, `Session`, `VerificationToken`.
