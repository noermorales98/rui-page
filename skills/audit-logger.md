# Skill: audit-logger

## Cuándo usarla
Toda mutación de: `Deal`, `CrmSale`, `CrmCampaign`, `CrmForm`, `User`, `Integration`. Recomendado también en `Contact`.

## Helper
`lib/audit/index.ts`:
```ts
import { prisma } from "@/lib/db/prisma";
import type { AuditAction } from "@prisma/client";

type LogParams = {
  actorId: number | null;
  entityType: string;
  entityId: number;
  action: AuditAction;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export async function logAudit(p: LogParams) {
  await prisma.auditLog.create({ data: p });
}
```

## Uso
```ts
import { logAudit } from "@/lib/audit";

await prisma.deal.update({ where:{id}, data:{stage:"DEMO"} });
await logAudit({
  actorId: session.user.id,
  entityType: "Deal",
  entityId: id,
  action: "STAGE_CHANGE",
  changes: { stage: { from:"LEAD", to:"DEMO" } },
});
```

## Reglas
- Calcular `changes` como diff (solo campos modificados).
- Nunca registrar PII completa (passwords, tokens) en `metadata`.
- Si la mutación falla, **no** registrar audit (envolver tras éxito).
- Para mutaciones masivas, registrar 1 entrada por operación batch con `metadata.count`.

## ContactActivity vs AuditLog
- `ContactActivity` → eventos visibles en timeline del contacto (humano-friendly).
- `AuditLog` → trazabilidad técnica/compliance (admin-only).
- Mismas acciones pueden generar ambos.

## Anti-patrones
- Loguear lecturas (no aporta valor, infla DB).
- Loguear sin actorId si hay sesión (usar `system` solo cuando es webhook).
- Mezclar campos en `changes` sin estructura `{ field: { from, to } }`.
