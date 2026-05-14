# QA Report — branch `feat/sprint-1-schema-roles` — 2026-05-13

## Scope
Sprint 1 — Schema final + Auth con 3 roles. No production code paths
exercised yet (no services, no UI flows beyond login). All deliverables are
schema/infrastructure.

## Summary
| Check        | Status                      | Notes |
|--------------|-----------------------------|-------|
| Lint         | ✅                          | 0 errors, 33 pre-existing warnings in landing pages (`<img>` usage). Not introduced by this sprint. |
| TypeCheck    | ✅                          | `tsc --noEmit` exit 0. |
| Unit tests   | ⚠️  N/A                     | Vitest is not yet installed (planned for Sprint 2+). |
| E2E tests    | ⚠️  N/A                     | Playwright is not yet installed (planned post-MVP). |
| Coverage     | ⚠️  N/A                     | No test runner. |
| Prisma       | ✅                          | `migrate status` reports DB up to date, `generate` clean. |
| Dev server   | ✅                          | Boots in ~200 ms via Turbopack. |
| Auth E2E     | ✅                          | Login `admin@crm.local / admin1234` → `session.user.role === "ADMIN"` verified through real `/api/auth/callback/credentials` → `/api/auth/session` flow. |

## Manual smoke
| URL                 | HTTP | Notes |
|---------------------|------|-------|
| `GET /`             | 200  | Root landing renders. |
| `GET /crm-login`    | 200  | Login page renders. |
| `GET /crm` (cookie) | 307  | Middleware redirect (expected). |

## Críticos cubiertos
- [x] Auth: login + role surfaced on session (manual E2E vía curl).
- [x] Schema migration applied without breaking existing data (2 legacy admins migrated, then replaced by seed).
- [x] Role guard helper (`requireSession`/`requireRole`/`AuthError`) compiles and is wired to the new `Role` type.
- [x] AuditLog and `addActivity` helpers compile (not yet wired into mutations — by design, Sprint 2 work).
- [ ] Soft delete behavior in lists/queries — owed to Sprint 2 (services that filter `deletedAt: null`).
- [ ] Permissions matrix end-to-end — needs services + UI to test; Sprint 2+.

## SDD vs code — discrepancies detected
1. **Session TTL.** `BUSINESS_RULES.md §5.3` says JWT expires in 7 días; `auth.ts` still uses `maxAge: 8 * 60 * 60`. Not touched in Sprint 1 (no role-related change). Recommend bumping to `7 * 24 * 60 * 60` in a follow-up.
2. **UI dropdown for user role.** `usuarios/actions.ts` Zod enum is updated to `[ADMIN, VENDEDOR, ASISTENTE]`, but the UI form may still expose the legacy `EDITOR` option in its `<select>`. Compiles, but a submit with that value would 422 against the new enum. Owed to a UI sprint.
3. **PR template.** `.github/pull_request_template.md` was missing; created in this sprint with a minimal Sprint-1-aware template.

## Veredicto sugerido
🟢 **APPROVED_WITH_NOTES** — schema and auth foundation land cleanly; the two notes above are cosmetic / future-sprint items.

## Próximos pasos
1. Sprint 2 wires services to use `requireRole`, `logAudit`, `addActivity`.
2. Stand up Vitest + a CI lane that runs `lint`, `typecheck`, `db:status`,
   and a tiny smoke test of `auth.authorize()` for each canonical role.
3. Patch the `usuarios` UI dropdown and bump session TTL to 7 days.

## Commits (Sprint 1)
- `81b82ec` feat(prisma): apply full MVP schema (T1)
- `b4ba3d9` feat(seed): replace dev seed with 3 canonical role-coverage users (T2)
- `e9d724f` feat(auth): add requireSession/requireRole/AuthError helper (T3)
- `ed9c21c` feat(auth): refactor Auth.js v5 to use Role type and PrismaAdapter (T4)
- `79d1c8f` feat(audit,activity): add logAudit and addActivity helpers (T5)
