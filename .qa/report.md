# QA Report — branch `feat/sprint-2-contacts-tags-activity` — 2026-05-13

## Scope
Sprint 2 — Contactos + Tags + Activity per `docs/sdd/ROADMAP.md §Sprint 2`,
piggybacked with a visual refresh that ports every CRM page to the new
`app/crm/_lib/ui-tokens.ts` design tokens and refreshed UI primitives.

## Summary
| Check        | Status | Notes |
|--------------|--------|-------|
| Lint         | ✅      | 0 errors, 30 pre-existing warnings in marketing landing pages (`<img>` usage). Same warnings as Sprint 1, none introduced here. |
| TypeCheck    | ✅      | `npx tsc --noEmit` exit 0. |
| Unit tests   | ⚠️  N/A | Vitest still not installed (Sprint 11 per ROADMAP). |
| E2E tests    | ⚠️  N/A | Playwright still not installed. |
| Coverage     | ⚠️  N/A | No test runner. |
| Prisma       | ✅      | `migrate status` reports DB up to date. `lib/prisma.ts` now sets `collation: UTF8MB4_UNICODE_CI` + `charset: utf8mb4` on the adapter so `contains` LIKE queries no longer 500 with `Illegal mix of collations`. |
| Dev server   | ✅      | Boots ~240 ms via Turbopack. |
| Auth E2E     | ✅      | `admin@crm.local / admin1234` → `session.user.role === "ADMIN"` via real csrf → callback → session round-trip. |
| Routes smoke | ✅      | `/`, `/crm/contactos`, `/crm/contactos?q=admin`, `/crm/contactos?status=NEW&status=QUALIFIED`, `/crm/contactos?source=MANUAL`, `/crm/contactos/nuevo`, `/crm/contactos/importar` all 200. `/crm/contactos/3` 404 (Contact table empty by design until real users come in). |

## Sprint 2 deliverables vs ROADMAP
- [x] **CRUD Contact con Zod** — `lib/validators/contacts.ts` + `lib/services/contacts.ts`. Server actions in `app/crm/contactos/*` are thin wrappers.
- [x] **Soft delete activo** — `softDeleteContact` (ADMIN/VENDEDOR only). List + detail + metric queries all filter `deletedAt: null`. CSV import revives soft-deleted contacts on email match.
- [x] **Import CSV con reporte de errores** — `/crm/contactos/importar` page + `importContactsFile` server action + `importContactsCsvFromBuffer` service using `csv-parse/sync`. Reports `{ row, message }[]` with per-row failures, in-file email dedupe, ES/EN column aliases (nombre→name, correo→email, …).
- [x] **Tags CRUD + asignación** — `lib/services/tags.ts` (`listTags`, `createTag`, `updateTag`, `softDeleteTag`, `ensureTagsByNames`, `upsertTagByName`). `addTag`/`removeTag` for contact ↔ tag link live in the contacts service (idempotent P2002 handling).
- [x] **Timeline de actividad en vista detalle** — `ActivityTimeline` aliases `ActivityFeed`, ordered desc, takes top 20. `addActivity` service wires through `lib/services/_activity.ts` helper from Sprint 1 T5.
- [x] **AuditLog en mutaciones** — every contact/tag mutation calls `logAudit` with diff payload (`{ field: { from, to } }`). Import batches log a single entry with metadata counts.

## Business rules implemented
- BR §1 role matrix: contacts CRUD allowed for all 3 roles; soft delete + tag CRUD restricted to ADMIN/VENDEDOR. ASISTENTE cannot soft delete (UI hides the button via `canDelete` flag).
- BR §2.1 status auto-promotion not yet auto-fired by other services (Deals/Sales) — they're future sprints. **Status degrade rule** is enforced here: only ADMIN can move status backward (NEW ← QUALIFIED ← CLIENT).
- BR §3 dedupe: import deduplicates by email within the same CSV; also matches against existing rows (revives soft-deleted on match).

## Discrepancias / notas para futuro
1. **Test infrastructure** still owed (Vitest + Playwright). The contact-metrics unit test exists at `app/crm/contactos/_lib/contact-metrics.test.ts` but cannot run until Sprint 11.
2. **`session.user.id`** is a string in the JWT but cast to `Number(...)` in services. Works for now (User.id is Int) but if we ever switch to UUID we'll need to revisit.
3. **Tag deletion behaviour**: soft-deleted tags still appear in `ContactTag` joins. `listContacts` and `getContact` explicitly filter `tag.deletedAt: null` in the include `where`. New consumers should mirror that or they'll see ghost tags.
4. **No dedicated tags admin UI**. Tag CRUD only happens inline through `ensureTagsByNames` when a contact form types a new tag name. Standalone tag management is a follow-up.

## Veredicto sugerido
🟢 **APPROVED** — Sprint 2 deliverables shipped end-to-end, dev boot + login + filtered routes green, no tsc/lint errors. Visual refresh on other modules is cosmetic-only and passes type-check.

## Commits
- `afcbb14` chore(infra): csv-parse + `.gitignore` + prisma collation
- `0c742fd` feat(crm): Sprint 2 contacts module + design system foundation
- `6839b28` feat(crm): visual refresh — adopt design tokens in non-contacts modules
- `f24a287` chore(docs): archive superseded modal-era notes, refresh specs
