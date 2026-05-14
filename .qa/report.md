# QA Report — branch `feat/sprint-3-pipeline` — 2026-05-13

## Scope
Sprint 3 — Pipeline + AuditLog general per `docs/sdd/ROADMAP.md §Sprint 3`.

## Summary
| Check        | Status | Notes |
|--------------|--------|-------|
| Lint         | ✅      | 0 errors, 32 warnings (pre-existing landing pages). The cascading-render error in `EditTagRow` was found by this sprint's lint run and fixed inline. |
| TypeCheck    | ✅      | `npx tsc --noEmit` exit 0. |
| Unit tests   | ⚠️  N/A | Vitest still owed (Sprint 11). |
| E2E tests    | ⚠️  N/A | Playwright still owed. |
| Prisma       | ✅      | `migrate status` up to date. |
| Dev server   | ✅      | Boots ~160 ms via Turbopack. |
| Auth E2E     | ✅      | Login worked for all 3 demo accounts (302 each). |
| Routes smoke | ✅      | `/crm/pipeline` 200 for all 3 roles. `/crm/pipeline/9999` 404 (no deal exists). |

## Sprint 3 deliverables vs ROADMAP
- [x] **Kanban con `@dnd-kit` para Deal stages** — already existed; refactored to consume `listDealsGrouped` service and propagate `canMutate`/`canDelete` props.
- [x] **Crear Deal desde Contact** — `NewDealButton` on the contact detail page hits `createDeal` action, which now goes through `lib/services/deals.ts` with `requireRole(['ADMIN','VENDEDOR'])` + audit + Contact status auto-promote.
- [x] **`moveDeal` con `STAGE_CHANGE` log** — service writes an `AuditLog{action:STAGE_CHANGE, changes:{stage:{from,to}}}` on the Deal entity and a `ContactActivity{type:NOTE, body:"Deal movido de X a Y"}` on the linked contact.
- [x] **Vista de detalle de Deal con timeline** — `/crm/pipeline/[id]` shows stage badge, contact card, linked sales summary + PAID total, optional notes, and a merged timeline (AuditLog rows on the deal ∪ matching ContactActivity NOTE rows on the contact, sorted desc).

## Business rules implemented
- BR §1 role matrix: read pipeline = all 3 roles; create/edit/move deal = ADMIN+VENDEDOR; soft delete deal = ADMIN only. Both server-side (services) and UI (drag-disable, hide buttons).
- BR §2.1 status auto-promotion: first deal on a `NEW` contact lifts status to `QUALIFIED`, with a `STATUS_CHANGE` audit entry for the contact.
- BR §2.2 no-delete-with-active-sale: `softDeleteDeal` returns `CONFLICT` if the deal has a PAID `CrmSale` (soft-deleted sales are ignored).

## Discrepancias / notas para futuro
1. The `AuditLog` view per ROADMAP Sprint 10 still lives in admin-only Settings; we only consume it in the new deal-detail timeline today.
2. The `lib/services/deals.ts` module deliberately does NOT carry `'use server'` — it exports the typed includes (`DealListItem`, `DealDetail`) and would otherwise fail Next 16's "only async exports" check. The service is server-side by virtue of importing `prisma` + `auth` so this is fine.
3. ASISTENTE sees the board read-only; they can navigate to the deal detail but cannot move/edit/delete. The UI hides the buttons; the service rejects with FORBIDDEN as a defence-in-depth.
4. Tag administration UI shipped separately in PR #6 (`/crm/configuracion/etiquetas`).

## Veredicto sugerido
🟢 **APPROVED**.

## Commits
- `e0f02e4` feat(deals): service layer + validators (T1+T2)
- `7db3c82` feat(pipeline): deal detail page with timeline (T3)
- `5c751e8` refactor(pipeline): actions become thin wrappers (T4)
- `7ad6ef0` feat(pipeline): role-gated UI + deal detail link (T5)
- `7532a06` fix(tags-admin): defer EditTagRow close to next tick (lint follow-up)
- `3fdabf1` fix(deals): move PIPELINE_STAGES out of 'use server' module
