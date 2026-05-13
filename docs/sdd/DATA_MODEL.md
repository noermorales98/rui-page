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
- **Contact** — `id, name, email (required, unique), phone?, source(ContactSource), status(ContactStatus), deletedAt, createdAt, updatedAt`. Backref `flowRuns FlowRun[]` (ver §2.10).
- **Tag** — `id, name (unique), color, deletedAt`.
- **ContactTag** — join (contactId, tagId).
- **ContactActivity** — log por contacto: `type(ActivityType), body?, createdById?, createdAt`. Índice `(contactId, createdAt)` para timeline.

### 2.3 Pipeline & Ventas
- **Deal** — `id, contactId, courseName?, stage(DealStage), notes?, deletedAt`.
- **CrmSale** — `id, contactId, dealId?, productName, amountCents, currency, status(CrmSaleStatus), paymentMethod(CrmPaymentMethod), soldAt, notes?, createdById?, stripeSessionId? (unique), stripePaymentIntentId? (unique), stripeCustomerId?, deletedAt`.
- **StripeEvent** — `id, eventId (unique), type, payload(Json), processedAt?, createdAt`. Idempotencia de webhooks.

### 2.4 Webinars
- **Webinar** — `id, title, date, platform?, link?, description?, deletedAt`. Índice `(date)`.
- **WebinarRegistration** — `webinarId, contactId, status(RegistrationStatus)`. Unique (webinarId, contactId).
- **WebinarIntegration** — `id, webinarId (unique), integrationId, externalId? (zoom meetingId, etc), config(Json)?, lastSyncAt?`. 1↔1 con `Webinar`, N↔1 con `Integration`.

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

### 2.9 Landings
- **Landing** — `id, name, slug (unique), status(LandingStatus), title?, description?, ogImageUrl?, faviconUrl?, customHead?, customCss?, formId? → CrmForm, ownFormConfig(Json)?, flowId? → Flow (relation "LandingFlow"), createdById?, deletedAt`.
- **LandingBlock** — `id, landingId, type(LandingBlockType), position, config(Json), customHtml?, customCss?`. Cascade desde Landing.
- **LandingView** — `id, landingId, ipHash VarChar(64), uaHash VarChar(64), referer?, utm(Json)?, viewedAt`. Cascade desde Landing.

### 2.10 Flows (automatizaciones)
- **Flow** — `id, name, description?, trigger(FlowTrigger), triggerConfig(Json)?, status(FlowStatus), createdById?, deletedAt`. Relación inversa con `Landing` vía "LandingFlow".
- **FlowStep** — `id, flowId, position, action(FlowStepAction), config(Json), delayMins`. Cascade desde Flow.
- **FlowRun** — `id, flowId, contactId?, triggerPayload(Json)?, status(FlowRunStatus), startedAt, finishedAt?, errorMessage?`. Cascade desde Flow.
- **FlowRunStep** — `id, runId, stepId, position, status(FlowRunStatus), runAt, executedAt?, result(Json)?, errorMessage?, attempts`. Cascade desde FlowRun y FlowStep.

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
- `CrmFormFieldType`: SHORT_TEXT, FULL_NAME, PHONE, PHONE_WITH_COUNTRY, EMAIL, CUSTOM_DATE, CUSTOM_TIME, CUSTOM_DATETIME.
- `CrmFormContactTarget`: NONE, NAME, EMAIL, PHONE.
- `RegistrationStatus`: REGISTERED, ATTENDED, PURCHASED.
- `IntegrationProvider`: ZOOM, STREAMYARD, STRIPE, WHATSAPP_CLOUD, SMTP.
- `IntegrationStatus`: ACTIVE, DISABLED, ERROR.
- `AuditAction`: CREATE, UPDATE, DELETE, STATUS_CHANGE, STAGE_CHANGE, LOGIN.
- `LandingStatus`: DRAFT, PUBLISHED, ARCHIVED.
- `LandingBlockType`: HERO, VIDEO, CTA, FORM_EMBED, TESTIMONIALS, FAQ, FOOTER, CUSTOM_HTML.
- `FlowTrigger`: FORM_SUBMITTED, LANDING_VIEWED, LANDING_SUBMITTED, WEBINAR_REGISTERED, WEBINAR_ATTENDED, SALE_PAID.
- `FlowStatus`: DRAFT, ACTIVE, PAUSED, ARCHIVED.
- `FlowStepAction`: REDIRECT, ASSIGN_TAG, MOVE_DEAL, CREATE_DEAL, SEND_EMAIL, SEND_WHATSAPP, UPDATE_CONTACT_STATUS, WAIT.
- `FlowRunStatus`: PENDING, RUNNING, COMPLETED, FAILED, CANCELED.

## 4. Índices clave
Ya definidos por modelo. Revisión periódica al crecer volumen.

## 5. Migraciones pendientes (desde schema actual)
_Ninguna. Schema completo aplicado en `20260513161133_add_full_mvp_schema` (Sprint 1)._
