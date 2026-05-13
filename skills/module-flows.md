# Skill: module-flows

## Alcance
`/crm/flows`. Constructor visual de automatizaciones disparadas por triggers (form, landing, webinar, sale).

## Pre-lectura
- `sdd-loader`, `zod-validator`, `role-guard`, `audit-logger`, `error-handling`.
- `flow-engine.md` (motor de ejecución).
- `ui-component.md`, `rsc-patterns.md`, `i18n-spanish.md`.

## Estructura
```
app/crm/flows/
  page.tsx                          # listado
  nuevo/page.tsx
  [id]/page.tsx                     # builder
  [id]/runs/page.tsx                # historial de ejecuciones
  [id]/runs/[runId]/page.tsx        # detalle run + timeline
  _components/
    FlowsTable.tsx
    FlowBuilder.tsx
    StepEditor.tsx
    ActionPicker.tsx
    TriggerSelector.tsx
    RunsTable.tsx
    RunTimeline.tsx
app/api/cron/flows/tick/route.ts
lib/services/flows.ts
lib/validators/flows.ts
lib/flows/                          ← motor (ver flow-engine.md)
```

## Server actions
- CRUD: `listFlows`, `getFlow`, `createFlow`, `updateFlow`, `softDeleteFlow`.
- Lifecycle: `activateFlow`, `pauseFlow`, `archiveFlow`.
- Steps: `saveSteps(flowId, steps)`.
- Runs: `listRuns(flowId)`, `getRun(id)`.
- Solo ADMIN/VENDEDOR.

## Triggers disponibles
- `FORM_SUBMITTED` — `triggerConfig: { formId? }` (vacío = cualquier form).
- `LANDING_VIEWED` — `triggerConfig: { landingId? }`.
- `LANDING_SUBMITTED` — `triggerConfig: { landingId? }`.
- `WEBINAR_REGISTERED` — `triggerConfig: { webinarId? }`.
- `WEBINAR_ATTENDED` — `triggerConfig: { webinarId? }`.
- `SALE_PAID` — `triggerConfig: { productName? }`.

## Actions disponibles (`FlowStepAction`)
| Action | Config |
|---|---|
| REDIRECT | `{ url }` |
| ASSIGN_TAG | `{ tagId }` |
| MOVE_DEAL | `{ stage, courseName? }` (crea Deal si no existe) |
| CREATE_DEAL | `{ courseName, stage }` |
| SEND_EMAIL | `{ templateId, subjectOverride? }` |
| SEND_WHATSAPP | `{ templateName, language, variables }` |
| UPDATE_CONTACT_STATUS | `{ status }` |
| WAIT | `{ minutes }` (alternativa a delayMins) |

## Builder
- Lista vertical de steps (drag para reordenar con `@dnd-kit`).
- Selector de trigger arriba.
- Cada step: action + config + `delayMins` (delay desde el paso previo).
- `REDIRECT` solo permitido en `position = 0`. Validación bloqueante.
- Preview lateral con el "viaje" en texto: "Cuando X → esperar Y min → enviar email Z".

## Reglas
- Solo `ACTIVE` se ejecutan.
- Cambios en pasos NO afectan runs en curso.
- Borrar flow con runs PENDING: cancela esos runs (status CANCELED).
- Múltiples flows pueden disparar para el mismo evento (todos los ACTIVE matching).
- Si trigger es `LANDING_VIEWED`: ejecutar solo 1 vez por contacto por landing (dedupe por `contactId + landingId`).
- Si Contact no está identificado (ej. `LANDING_VIEWED` sin sesión ni cookie): no disparar acciones que requieren contactId.

## Vista Runs
- Tabla: id, trigger, contact, status, startedAt, duración.
- Filtros por status, fecha.
- Detalle: timeline vertical con cada `FlowRunStep` (icono action, estado, resultado, error).

## Reintentos
- Step FAILED reintenta hasta 3 veces (configurable en engine).
- Backoff: 1 min, 5 min, 15 min.
- Tras 3 → run FAILED, errorMessage en el step.

## Reglas duras
- AuditLog en CREATE, UPDATE, ACTIVATE, PAUSE, ARCHIVE, DELETE.
- ContactActivity por cada step ejecutado relevante (e.g. CAMPAIGN_SENT, STAGE_CHANGE).
- No exponer detalles internos en RunStep.errorMessage para no-ADMIN.

## Testing
- Unit: matching de triggers, REDIRECT solo en pos 0, dedupe LANDING_VIEWED.
- Integration: `dispatch(FORM_SUBMITTED)` → run creado con 3 steps + delays.
- E2E: crear flow simple → submit form que lo dispara → ver run completado en lista.

## Done
- Builder fluido.
- Trigger + dispatch funcionan punta a punta.
- Vista runs muestra estado real.
- AuditLog completo.
