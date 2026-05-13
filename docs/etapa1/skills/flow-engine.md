# Skill: flow-engine

## Cuándo usarla
Implementar o modificar el motor que ejecuta flows.

## Pre-lectura
- `module-flows.md`
- `error-handling.md`
- `performance.md`

## Componentes
```
lib/flows/
  engine.ts            # API pública: dispatch, enqueue, processPending
  triggers.ts          # matching trigger → flows aplicables
  actions/             # implementación de cada FlowStepAction
    redirect.ts
    assign-tag.ts
    move-deal.ts
    create-deal.ts
    send-email.ts
    send-whatsapp.ts
    update-contact-status.ts
    wait.ts
  types.ts
```

## API pública del engine

### `dispatch(trigger, payload)`
Invocada por services al ocurrir un evento.
```ts
type DispatchPayload = {
  contactId?: number;
  formId?: number;
  landingId?: number;
  webinarId?: number;
  saleId?: number;
  productName?: string;
  meta?: Record<string, unknown>;
};

export async function dispatch(
  trigger: FlowTrigger,
  payload: DispatchPayload,
): Promise<{ redirectUrl?: string; runIds: number[] }> {
  // 1. Buscar flows ACTIVE matching trigger + triggerConfig.
  // 2. Para cada match, crear FlowRun + FlowRunSteps con runAt calculado.
  // 3. Si el primer step de algún flow es REDIRECT, ejecutarlo sincrónicamente y devolver URL.
  // 4. El resto queda PENDING para el cron.
}
```

### `enqueueFlowRun(flowId, contactId, payload)`
- Crea `FlowRun` (status PENDING).
- Crea `FlowRunStep[]` con `runAt = startedAt + sum(delays anteriores) + delay propio`.
- Marca primer step PENDING con `runAt = now` (salvo que tenga `delayMins > 0`).

### `processPendingSteps(now)`
Invocada por `/api/cron/flows/tick`.
```ts
export async function processPendingSteps(now = new Date()) {
  // 1. Lock optimista: SELECT for UPDATE las primeras N steps PENDING con runAt <= now.
  // 2. Marcar como RUNNING (transacción).
  // 3. Para cada step: try executeStep → COMPLETED, catch → reintento o FAILED.
  // 4. Si todos los steps del run completaron → run COMPLETED.
}
```

### `executeStep(stepRun, run)`
- Lee `step.action` y `step.config`.
- Llama a la action correspondiente.
- Guarda `result` JSON, `executedAt`, `status`.

## Matching de triggers

`triggers.ts` recibe (trigger, payload) y devuelve flows aplicables:
```ts
export async function findMatchingFlows(
  trigger: FlowTrigger,
  payload: DispatchPayload,
): Promise<Flow[]> {
  const flows = await prisma.flow.findMany({
    where: { trigger, status: "ACTIVE", deletedAt: null },
    include: { steps: { orderBy: { position: "asc" } } },
  });
  return flows.filter(f => matchesConfig(f.triggerConfig, payload));
}

function matchesConfig(cfg: unknown, payload: DispatchPayload): boolean {
  if (!cfg || Object.keys(cfg as object).length === 0) return true;
  // p.ej. { formId: 12 } debe coincidir con payload.formId === 12.
}
```

## Cálculo de `runAt`
- Step 0: `runAt = startedAt + delay0`.
- Step N: `runAt = startedAt + sum(delays 0..N)`.
- Si `WAIT` action está en step: su `delayMins` se acumula igual.

## Dedupe LANDING_VIEWED
Antes de crear `FlowRun`:
```ts
if (trigger === "LANDING_VIEWED") {
  const exists = await prisma.flowRun.findFirst({
    where: {
      flowId,
      contactId: payload.contactId ?? undefined,
      triggerPayload: { path: ["landingId"], equals: payload.landingId },
    },
  });
  if (exists) return null;
}
```

## Reintentos
Cada step tiene `attempts` (default 0). Al fallar:
```ts
if (stepRun.attempts < 3) {
  const backoff = [1, 5, 15][stepRun.attempts] ?? 15;
  await prisma.flowRunStep.update({
    where: { id: stepRun.id },
    data: {
      status: "PENDING",
      attempts: stepRun.attempts + 1,
      runAt: addMinutes(new Date(), backoff),
      errorMessage: e.message,
    },
  });
} else {
  await prisma.flowRunStep.update({ where:{id}, data: { status:"FAILED", errorMessage:e.message }});
  await prisma.flowRun.update({ where:{id:runId}, data: { status:"FAILED" }});
}
```

## Endpoint cron `/api/cron/flows/tick`
```ts
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await processPendingSteps();
  return Response.json(result);
}
```

## Configuración cron-job.org
- URL: `https://<dominio>/api/cron/flows/tick`.
- Método: POST.
- Header: `Authorization: Bearer <CRON_SECRET>`.
- Schedule: cada 1 minuto.
- Timeout: 30s.

## Actions — contrato común
```ts
type ActionContext = {
  run: FlowRun;
  step: FlowStep;
  stepRun: FlowRunStep;
  contact: Contact | null;
  payload: DispatchPayload;
};

export type ActionFn = (ctx: ActionContext) => Promise<{
  ok: boolean;
  result?: Record<string, unknown>;
  redirectUrl?: string;
  error?: string;
}>;
```

## REDIRECT (caso especial)
- Solo se permite en `step.position === 0`.
- Se ejecuta **sincrónicamente** dentro de `dispatch()`.
- Devuelve `redirectUrl` al caller (el route handler del form/landing).
- Cliente hace `window.location.href = redirectUrl`.

## Idempotencia
- El cron tick puede dispararse 2 veces simultáneo. Usar transacción + `updateMany` con `where: { status: "PENDING" }` para evitar doble ejecución.
- Tabla index `[status, runAt]` ya prevista en `DATA_MODEL.md`.

## Performance
- Procesar máx 50 steps por tick (batch).
- Si hay > 50 PENDING con `runAt <= now`, el siguiente tick los toma.
- Cron cada 1 min = throughput ~3000 steps/hora.

## Logging
- Cada step ejecutado: `{ level:"info", flowId, runId, stepId, action, durationMs }`.
- Errores: `{ level:"error", ... errorMessage }` (sin PII completa).

## Reglas duras
- Nunca ejecutar step de flow `PAUSED` o `ARCHIVED` o `deletedAt`.
- Verificar `flow.status === "ACTIVE"` al inicio de cada step ejecutado.
- Si action falla por `Contact` borrado → step COMPLETED con `result.skipped = true` (no es error real).

## Testing
- Unit: cálculo de runAt con varios delays.
- Unit: REDIRECT solo en pos 0.
- Unit: matching de triggerConfig vacío vs específico.
- Integration: enqueue + processPending procesa todo.
- Integration: reintentos con fallos forzados.

## Done
- Engine procesa 50 steps/tick sin trabarse.
- Reintentos funcionan.
- REDIRECT sincrónico devuelve URL.
- Cron externo configurado.
