# API_SPEC — CRM Rui

## 1. Principios
- App es Next 16 (App Router) → la mayoría son **server actions**, no REST.
- Endpoints REST solo para: webhooks externos, OAuth callbacks, submission pública de formularios.
- Toda entrada se valida con **Zod**.
- Toda acción crítica registra **AuditLog**.
- Toda mutación que afecta contacto registra **ContactActivity**.
- Permisos vía helper `requireRole(...)` antes de ejecutar.

## 2. Convenciones server actions
- Archivo: `lib/services/<dominio>.ts`.
- Exportan funciones `async` con `"use server"` cuando se invocan desde cliente.
- Retornan `{ ok: true, data } | { ok: false, error: { code, message, fields? } }`.

## 3. Endpoints REST

### 3.1 Webhooks
| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| POST | `/api/stripe/webhook` | Stripe signature | Procesa eventos pago. Idempotente vía `StripeEvent`. |
| POST | `/api/whatsapp/webhook` | Meta verify token + signature | Estado entrega WA, respuestas inbound. |
| GET  | `/api/whatsapp/webhook` | Meta hub challenge | Verificación inicial. |
| POST | `/api/zoom/webhook` | Zoom verification token | Eventos registro/asistencia. |

### 3.2 OAuth
| Método | Ruta | Propósito |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | Auth.js handler. |
| GET | `/api/integrations/zoom/callback` | OAuth code → token. |

### 3.3 Formularios públicos
| Método | Ruta | Propósito |
|---|---|---|
| GET | `/formularios/[slug]` | Render público del form. |
| GET | `/embed/formularios/[slug]` | Versión iframe-friendly. |
| POST | `/api/forms/[slug]/submit` | Procesa submission → crea/actualiza Contact. Rate limit. |

## 4. Server actions por dominio

### 4.1 Contactos (`lib/services/contacts.ts`)
- `listContacts(filters, pagination)` — paginado.
- `getContact(id)`.
- `createContact(input)` — valida unique email.
- `updateContact(id, input)`.
- `softDeleteContact(id)`.
- `importContactsCsv(file)` — devuelve resumen `{ inserted, updated, errors }`.
- `addTag(contactId, tagId)` / `removeTag(...)`.
- `addActivity(contactId, type, body)`.

### 4.2 Pipeline (`lib/services/deals.ts`)
- `listDeals(filters)`.
- `createDeal(contactId, input)`.
- `moveDeal(dealId, toStage)` — registra `STAGE_CHANGE`.
- `updateDeal(id, input)`.
- `softDeleteDeal(id)`.

### 4.3 Ventas (`lib/services/sales.ts`)
- `listSales(filters)`.
- `createManualSale(input)`.
- `markRefund(id, reason)`.
- `recordSaleFromStripe(stripePayload)` — interno desde webhook.

### 4.4 Webinars (`lib/services/webinars.ts`)
- `listWebinars()`.
- `createWebinar(input)`.
- `updateWebinar(id, input)`.
- `syncZoomRegistrations(webinarId)` — pull Zoom API.
- `markAttendance(registrationId, status)`.

### 4.5 Formularios (`lib/services/forms.ts`)
- `listForms()`.
- `createForm(input)`.
- `updateForm(id, input)`.
- `addField(formId, field)` / `updateField` / `removeField` / `reorderFields`.
- `publishForm(id)` / `archiveForm(id)`.
- `submitForm(slug, payload)` — interno desde `/api/forms/.../submit`.
- `listSubmissions(formId, pagination)`.

### 4.6 Campañas (`lib/services/campaigns.ts`)
- `listCampaigns(filters)`.
- `createCampaign(input)` — incluye `channel`, `segmentId | filters`, `templateId?`.
- `previewAudience(filters | segmentId)` — devuelve count + sample.
- `sendCampaign(id)` — encola envíos.
- `cancelCampaign(id)` — solo si DRAFT.
- `listRecipients(campaignId, filters)`.

### 4.7 Templates (`lib/services/templates.ts`)
- CRUD básico `CampaignTemplate`.

### 4.8 Segmentos (`lib/services/segments.ts`)
- CRUD básico.
- `evaluateSegment(filters)` → count + ids.

### 4.9 Usuarios (`lib/services/users.ts`)
- `listUsers()` (ADMIN only).
- `createUser(input)`.
- `updateUserRole(id, role)`.
- `deactivateUser(id)`.

### 4.10 Integraciones (`lib/services/integrations.ts`)
- `listIntegrations()`.
- `connectIntegration(provider, config)`.
- `disconnectIntegration(id)`.
- `testIntegration(id)`.

### 4.11 Auditoría (`lib/services/audit.ts`)
- `logAudit(actorId, entityType, entityId, action, changes?, metadata?)` — interno.
- `listAuditLog(filters)` (ADMIN only).

## 5. Códigos de error
- `UNAUTHORIZED` — sin sesión.
- `FORBIDDEN` — sin rol.
- `VALIDATION_ERROR` — Zod fail (incluye `fields`).
- `NOT_FOUND`.
- `CONFLICT` — unique violation.
- `RATE_LIMITED`.
- `INTEGRATION_ERROR` — fallo externo.
- `INTERNAL_ERROR`.
