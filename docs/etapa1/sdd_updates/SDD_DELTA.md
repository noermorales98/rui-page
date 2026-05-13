# SDD DELTA — Landings + Flows

> Cambios a aplicar sobre los docs SDD existentes para incorporar módulos Landings y Flows.

---

## A. Cambios en `PRD.md`

### Reemplazar §3 "Alcance MVP"
> 9 módulos: dashboard, contactos, pipeline, ventas, webinars, formularios, **landings**, campañas, **flujos**.

### Agregar §3.8 Landings
- Constructor visual con **bloques predefinidos** + **lienzo libre HTML/CSS**.
- Bloques base: hero, video, CTA, form embed, testimonios, FAQ, footer, sección personalizada.
- Publicación en ruta pública `/l/[slug]`.
- Captura de datos: form embebido (CrmForm existente) o form propio con campos fijos (configurable por landing).
- Tracking de visitas (`LandingView` con IP/UA hasheados).
- SEO básico: title, description, og:image.
- Estados: DRAFT, PUBLISHED, ARCHIVED.

### Agregar §3.9 Flujos (automatizaciones)
- Encadenar acciones tras un evento (trigger).
- **Triggers MVP:** form submission, landing submit/view, webinar registro, webinar asistencia, compra Stripe.
- **Acciones MVP:**
  - Redirigir (devolver URL al cliente tras submit).
  - Asignar tag al Contact.
  - Mover Deal a etapa.
  - Crear Deal.
  - Enviar email (template).
  - Enviar WhatsApp (template).
  - Actualizar status del Contact.
  - Esperar (delay N minutos/horas).
- Ejecución inmediata o con delay.
- Una vista de runs por flow con status (PENDING/RUNNING/COMPLETED/FAILED).

### Actualizar §5 "Métricas de éxito MVP"
Agregar:
- Procesamiento de FlowRunStep pendiente < 60 s desde su `runAt`.
- Render landing pública con FCP < 1.5 s.

---

## B. Cambios en `ARCHITECTURE.md`

### Capas — agregar carpetas
```
app/
  (public)/
    l/[slug]/                ← landings públicas
  crm/
    landings/
    flows/
  api/
    cron/flows/tick/         ← procesador de delays (cron externo)
lib/
  services/
    landings.ts
    flows.ts
  flows/
    engine.ts                ← motor de ejecución
    actions/
      redirect.ts
      assign-tag.ts
      move-deal.ts
      create-deal.ts
      send-email.ts
      send-whatsapp.ts
      update-contact-status.ts
      wait.ts
    triggers.ts              ← mapping trigger → flows que disparar
```

### Cron externo
- Servicio: cron-job.org (gratuito).
- Endpoint: `POST /api/cron/flows/tick`.
- Auth: header `Authorization: Bearer ${CRON_SECRET}`.
- Frecuencia: cada 1 minuto.
- Idempotente: marca cada step como `RUNNING` antes de ejecutar, vuelve a `PENDING` si excepción transitoria.

### Variables nuevas
```
CRON_SECRET=
LANDING_DEFAULT_FAVICON_URL=
```

---

## C. Cambios en `DATA_MODEL.md`

### Nuevos modelos

#### Landing
```prisma
enum LandingStatus { DRAFT PUBLISHED ARCHIVED }

model Landing {
  id           Int           @id @default(autoincrement())
  name         String
  slug         String        @unique @db.VarChar(191)
  status       LandingStatus @default(DRAFT)
  title        String?       // SEO
  description  String?       @db.Text
  ogImageUrl   String?
  faviconUrl   String?
  customHead   String?       @db.Text  // tags <meta>, scripts ext (sanitizados)
  customCss    String?       @db.Text
  formId       Int?          // form embebido opcional
  form         CrmForm?      @relation(fields:[formId], references:[id], onDelete:SetNull)
  ownFormConfig Json?        // si la landing usa form propio fijo
  flowId       Int?          // flow a disparar tras submit
  flow         Flow?         @relation("LandingFlow", fields:[flowId], references:[id], onDelete:SetNull)
  blocks       LandingBlock[]
  views        LandingView[]
  createdById  Int?
  createdBy    User?         @relation(fields:[createdById], references:[id], onDelete:SetNull)
  deletedAt    DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  @@index([status, updatedAt])
  @@index([deletedAt])
}
```

#### LandingBlock
```prisma
enum LandingBlockType { HERO VIDEO CTA FORM_EMBED TESTIMONIALS FAQ FOOTER CUSTOM_HTML }

model LandingBlock {
  id        Int               @id @default(autoincrement())
  landingId Int
  landing   Landing           @relation(fields:[landingId], references:[id], onDelete:Cascade)
  type      LandingBlockType
  position  Int               @default(0)
  config    Json              // props del bloque
  customHtml String?          @db.Text  // si type = CUSTOM_HTML
  customCss  String?          @db.Text
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  @@index([landingId, position])
}
```

#### LandingView
```prisma
model LandingView {
  id        Int      @id @default(autoincrement())
  landingId Int
  landing   Landing  @relation(fields:[landingId], references:[id], onDelete:Cascade)
  ipHash    String   @db.VarChar(64)
  uaHash    String   @db.VarChar(64)
  referer   String?  @db.Text
  utm       Json?
  viewedAt  DateTime @default(now())
  @@index([landingId, viewedAt])
  @@index([ipHash, landingId])
}
```

#### Flow
```prisma
enum FlowTrigger {
  FORM_SUBMITTED
  LANDING_VIEWED
  LANDING_SUBMITTED
  WEBINAR_REGISTERED
  WEBINAR_ATTENDED
  SALE_PAID
}
enum FlowStatus { DRAFT ACTIVE PAUSED ARCHIVED }

model Flow {
  id             Int          @id @default(autoincrement())
  name           String
  description    String?      @db.Text
  trigger        FlowTrigger
  triggerConfig  Json?        // ej. { formId: 12 } o { landingId: 3 }
  status         FlowStatus   @default(DRAFT)
  steps          FlowStep[]
  runs           FlowRun[]
  landings       Landing[]    @relation("LandingFlow")
  createdById    Int?
  createdBy      User?        @relation(fields:[createdById], references:[id], onDelete:SetNull)
  deletedAt      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@index([trigger, status])
  @@index([deletedAt])
}
```

#### FlowStep
```prisma
enum FlowStepAction {
  REDIRECT
  ASSIGN_TAG
  MOVE_DEAL
  CREATE_DEAL
  SEND_EMAIL
  SEND_WHATSAPP
  UPDATE_CONTACT_STATUS
  WAIT
}

model FlowStep {
  id        Int            @id @default(autoincrement())
  flowId    Int
  flow      Flow           @relation(fields:[flowId], references:[id], onDelete:Cascade)
  position  Int            @default(0)
  action    FlowStepAction
  config    Json           // params de la acción
  delayMins Int            @default(0)  // delay tras step previo
  runs      FlowRunStep[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  @@index([flowId, position])
}
```

#### FlowRun
```prisma
enum FlowRunStatus { PENDING RUNNING COMPLETED FAILED CANCELED }

model FlowRun {
  id         Int            @id @default(autoincrement())
  flowId     Int
  flow       Flow           @relation(fields:[flowId], references:[id], onDelete:Cascade)
  contactId  Int?
  contact    Contact?       @relation(fields:[contactId], references:[id], onDelete:SetNull)
  triggerPayload Json?
  status     FlowRunStatus  @default(PENDING)
  startedAt  DateTime       @default(now())
  finishedAt DateTime?
  steps      FlowRunStep[]
  errorMessage String?      @db.Text
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
  @@index([flowId, status, startedAt])
  @@index([contactId, startedAt])
}
```

#### FlowRunStep
```prisma
model FlowRunStep {
  id          Int            @id @default(autoincrement())
  runId       Int
  run         FlowRun        @relation(fields:[runId], references:[id], onDelete:Cascade)
  stepId      Int
  step        FlowStep       @relation(fields:[stepId], references:[id], onDelete:Cascade)
  position    Int
  status      FlowRunStatus  @default(PENDING)
  runAt       DateTime       // momento programado de ejecución
  executedAt  DateTime?
  result      Json?
  errorMessage String?       @db.Text
  attempts    Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  @@index([status, runAt])
  @@index([runId, position])
}
```

### Actualizar Contact
- Agregar relación inversa `flowRuns FlowRun[]`.

### Migraciones pendientes (agregar a §5)
1. Crear modelos: `Landing`, `LandingBlock`, `LandingView`, `Flow`, `FlowStep`, `FlowRun`, `FlowRunStep`.
2. Enums: `LandingStatus`, `LandingBlockType`, `FlowTrigger`, `FlowStatus`, `FlowStepAction`, `FlowRunStatus`.

---

## D. Cambios en `BUSINESS_RULES.md`

### Agregar a la matriz de permisos

| Acción | ADMIN | VENDEDOR | ASISTENTE |
|---|---|---|---|
| Ver landings | ✅ | ✅ | ✅ |
| Crear/editar landing | ✅ | ✅ | ✅ |
| Publicar/archivar landing | ✅ | ✅ | ❌ |
| Borrar landing | ✅ | ❌ | ❌ |
| Ver flows | ✅ | ✅ | ❌ |
| Crear/editar flow | ✅ | ✅ | ❌ |
| Activar/pausar flow | ✅ | ✅ | ❌ |
| Borrar flow | ✅ | ❌ | ❌ |
| Ver runs de flow | ✅ | ✅ | ❌ |

### Agregar §2.8 Landings
- Slug único.
- Solo landings `PUBLISHED` se renderizan en `/l/[slug]`.
- Cada submit genera `ContactActivity` `FORM_SUBMITTED` (mismo flujo que CrmForm) y dispara Flow si está configurado.
- `LandingView` se registra siempre que se visite una landing PUBLISHED.

### Agregar §2.9 Flows
- Solo flows `ACTIVE` se disparan ante eventos.
- Un trigger puede disparar múltiples flows (todos los ACTIVE matching).
- Si `triggerConfig` filtra por `formId`/`landingId`/`webinarId`, debe coincidir.
- Si Flow contiene `REDIRECT`, este debe ser el **primer step** y se devuelve sincrónicamente al cliente.
- Si el contacto no existe al disparar (raro), el flow se cancela con `errorMessage`.
- Reintentos en steps fallidos: máximo 3 con backoff exponencial. Tras 3 → `FAILED`.

---

## E. Cambios en `API_SPEC.md`

### Endpoints REST nuevos
| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/l/[slug]` | público | Render landing PUBLISHED + registrar `LandingView`. |
| POST | `/api/landings/[slug]/submit` | público + rate limit | Submit form propio de landing. Dispara flow. |
| POST | `/api/cron/flows/tick` | Bearer `CRON_SECRET` | Procesa `FlowRunStep` pendientes. |

### Server actions nuevas

#### Landings (`lib/services/landings.ts`)
- `listLandings(filters)`
- `getLanding(id)`
- `createLanding(input)`
- `updateLanding(id, input)`
- `softDeleteLanding(id)`
- `publishLanding(id)`, `archiveLanding(id)`
- `saveBlocks(landingId, blocks)` — diff + transacción
- `getLandingMetrics(id)` — views, conversions

#### Flows (`lib/services/flows.ts`)
- `listFlows(filters)`
- `getFlow(id)`
- `createFlow(input)`
- `updateFlow(id, input)`
- `saveSteps(flowId, steps)`
- `activateFlow(id)`, `pauseFlow(id)`, `archiveFlow(id)`
- `softDeleteFlow(id)`
- `listRuns(flowId, filters)`
- `getRun(id)` — con steps timeline

#### Engine (`lib/flows/engine.ts`)
- `dispatch(trigger, payload)` — interna, llamada desde otros services al ocurrir un evento.
- `enqueueFlowRun(flowId, contactId, payload)` — crea FlowRun + FlowRunSteps con `runAt` calculado.
- `processPendingSteps(now)` — lo invoca el cron tick.
- `executeStep(stepRun)` — invoca la action correspondiente.

---

## F. Cambios en `ROADMAP.md`

### Insertar sprints

**Sprint 6.5 — Landings (3–4 días)**
- [ ] Modelos Landing/Block/View + migración.
- [ ] CRUD landings + builder con bloques predefinidos.
- [ ] Editor de CUSTOM_HTML/CSS con sandbox (sanitización DOMPurify server-side).
- [ ] Render público `/l/[slug]` + `LandingView`.
- [ ] Submit form propio + reutilizar form embebido.
- [ ] Métricas básicas por landing.

**Sprint 7.5 — Flows (3–4 días)**
- [ ] Modelos Flow/FlowStep/FlowRun/FlowRunStep + migración.
- [ ] Builder visual de flow (lista vertical de steps con drag).
- [ ] `dispatch()` integrado en services (forms, landings, webinars, sales).
- [ ] 8 actions implementadas.
- [ ] Endpoint cron `/api/cron/flows/tick` + auth.
- [ ] Configurar cron-job.org cada 1 min.
- [ ] Vista de runs con timeline + errores.

### Total revisado
~38–42 días.

---

## G. Sanitización HTML
- **Server-side** con DOMPurify (jsdom) antes de guardar.
- Whitelist de tags: lo común (h1-h6, p, div, span, a, img, ul, ol, li, em, strong, br, video, iframe).
- iframe permitido solo desde dominios whitelist (`youtube.com`, `vimeo.com`).
- Sin `<script>` jamás. CSS sin `expression()`.
