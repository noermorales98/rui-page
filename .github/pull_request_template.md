<!--
  PR template — CRM Rui. Mantenelo corto y enfocado en evidencia.
  Si el cambio toca docs SDD (`docs/sdd/`), confirmá que el código y el doc
  quedaron alineados en este mismo PR.
-->

## Resumen
<!-- 1-3 bullets: qué cambia y por qué. Sin reciclar el commit message. -->

## Tipo
- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] chore / build
- [ ] docs
- [ ] test

## Docs SDD afectados
<!-- Marca solo si tocaste el archivo. -->
- [ ] PRD.md
- [ ] ARCHITECTURE.md
- [ ] DATA_MODEL.md
- [ ] API_SPEC.md
- [ ] BUSINESS_RULES.md
- [ ] CODE_RULES.md
- [ ] INTEGRATIONS.md
- [ ] ROADMAP.md
- [ ] N/A

## Migraciones / schema
- [ ] Sí, hay nueva migración (nombre: `<timestamp>_<nombre>`). Reviewer: revisar SQL.
- [ ] No.

## Checks locales
- [ ] `npm run lint` sin errores.
- [ ] `npm run typecheck` sin errores.
- [ ] `npm run db:status` aplicado.
- [ ] `npm run dev` arranca sin errores.
- [ ] Login probado end-to-end para al menos un rol (`ADMIN` mínimo).

## QA / tests
<!-- Pega un resumen del `.qa/report.md` o explica por qué no aplica. -->

## Riesgos / breaking changes
<!-- Cambios de schema, behavior, env vars nuevas, etc. -->

## Screenshots / video
<!-- Si tocaste UI. -->
