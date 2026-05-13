# AGENTS.md

Instrucciones para cualquier agente (Claude, Codex, otro) que trabaje en este repo.

## Antes de tocar nada
1. Lee la skill `skills/sdd-loader.md` y ejecútala.
2. Identifica qué módulo trabajarás.
3. Lee la skill correspondiente (`skills/module-*.md`).
4. Lee las skills transversales relevantes:
   - `skills/zod-validator.md` si hay inputs.
   - `skills/role-guard.md` siempre que sea server action.
   - `skills/audit-logger.md` si hay mutación de Deal/Sale/Campaign/Form/User/Integration.
   - `skills/prisma-migration.md` si tocas `schema.prisma`.

## Fuente de verdad
`docs/sdd/` manda sobre el código. Si encuentras inconsistencia: reporta y propón actualización del doc.

## Reglas duras
- Sin `any` no justificado.
- Sin server action sin validación Zod.
- Sin mutación crítica sin AuditLog.
- Sin tocar `schema.prisma` sin actualizar `DATA_MODEL.md` en el mismo PR.
- Sin libs nuevas sin actualizar `ARCHITECTURE.md`.
- Sin commits directos a `main`.

## Workflow
1. Branch: `feat/<modulo>-<detalle>` (libre).
2. Implementa siguiendo SDD + skill.
3. Tests propios (ver `skills/test-writer.md`).
4. `pnpm lint && pnpm typecheck && pnpm test`.
5. PR con descripción que mencione los docs/skills usados.
6. Revisión por `skills/reviewer-agent.md` (otro agente o tú mismo en pasada limpia).
7. Humano aprueba.

## Cosas que no debes hacer
- Inventar campos del schema.
- Asumir permisos sin consultar `BUSINESS_RULES.md`.
- Tocar `prisma/migrations/` ya aplicadas.
- Hacer `prisma db push`.
- Loguear secretos.
- Llamar APIs externas sin verificar firma de webhooks.

## Cuándo preguntar al humano
- Cambio de alcance fuera de `PRD.md`.
- Decisión que no resuelve `DATA_MODEL.md` ni `BUSINESS_RULES.md`.
- Migración con riesgo de pérdida de datos.
- Nueva integración no listada en `INTEGRATIONS.md`.
