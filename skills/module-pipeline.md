# Skill: module-pipeline

## Alcance
`/crm/pipeline`. Kanban Deal con drag&drop.

## Pre-lectura
- `sdd-loader`, `zod-validator`, `role-guard`, `audit-logger`.

## Estructura
```
app/crm/pipeline/
  page.tsx                          # board completo
  [id]/page.tsx                     # detalle deal
  _components/
    KanbanBoard.tsx                 # cliente
    KanbanColumn.tsx
    DealCard.tsx
    DealForm.tsx
    NewDealDialog.tsx
lib/services/deals.ts
lib/validators/deals.ts
```

## Server actions
- `listDealsGrouped()` → `{ LEAD: Deal[], DEMO: Deal[], NEGOTIATION: Deal[], ENROLLED: Deal[] }`.
- `createDeal(contactId, input)`.
- `moveDeal(dealId, toStage)`.
- `updateDeal(id, input)`.
- `softDeleteDeal(id)`.

## dnd-kit
- `DndContext` con `closestCenter`.
- 4 `SortableContext` por columna.
- `onDragEnd` → mutación optimista + revalidate.
- Server action `moveDeal` confirma. Si falla → revertir.

## Reglas
- `moveDeal` registra `STAGE_CHANGE` en `AuditLog` y `ContactActivity` con type `NOTE` (`"Movido de X a Y"`).
- Solo ADMIN/VENDEDOR pueden mover. ASISTENTE solo lectura.
- No permitir borrar Deal con `CrmSale` activa.

## Tarjeta Deal
- Nombre contacto + email truncado.
- Métodos de contacto disponibles (badges email/phone).
- Tiempo desde creación (`x días`).
- Indicador si hay venta asociada.

## Testing
- Unit: `moveDeal` registra audit + activity.
- E2E: arrastrar tarjeta entre 2 columnas, verificar persistencia.

## Done
- Drag fluido sin lag.
- Optimista + reconciliación correcta en error.
