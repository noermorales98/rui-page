# Skills — CRM Rui

Manuales reutilizables para agentes (Claude, Codex, humano). Carpeta neutra. `.claude/` y `.codex/` deben apuntar acá (symlink o referencia).

## Índice

### Transversales (siempre cargadas)
- `sdd-loader.md` — leer SDD antes de actuar.
- `prisma-migration.md` — cambios de schema.
- `zod-validator.md` — validación de inputs.
- `audit-logger.md` — registrar auditoría.
- `role-guard.md` — permisos por rol.
- `error-handling.md` — patrones de error, mapper, códigos.
- `rsc-patterns.md` — server vs client components.
- `performance.md` — queries, caching, paginación.
- `i18n-spanish.md` — textos UI, labels canónicos.
- `rate-limit.md` — endpoints públicos.

### UI y patrones de feature
- `ui-component.md` — componentes base Tailwind.
- `form-builder.md` — builder visual de formularios.
- `landing-builder.md` — builder visual de landing pages.
- `csv-import.md` — import CSV robusto.

### Por módulo
- `module-contacts.md`
- `module-pipeline.md`
- `module-forms.md`
- `module-landings.md`
- `module-webinars.md`
- `module-sales-stripe.md`
- `module-campaigns.md`
- `module-flows.md`
- `module-dashboard.md`

### Motores y métricas
- `flow-engine.md` — motor de ejecución de automatizaciones.
- `webinar-metrics.md` — atribución, conversión, asistencia.

### Calidad
- `test-writer.md`
- `reviewer-agent.md`

## Cómo trabaja un agente
1. Carga `sdd-loader` → lee todos los docs SDD (incluyendo deltas aplicados).
2. Carga la skill del módulo asignado.
3. Carga transversales que aplican.
4. Implementa siguiendo `CODE_RULES.md` + skills.
5. Si tocó schema → `prisma-migration`.
6. Si creó UI → `ui-component` + `rsc-patterns` + `i18n-spanish`.
7. Si afecta performance → `performance`.
8. Antes de PR → corre tests propios (`test-writer`).
9. Otro agente usa `reviewer-agent` para revisar.
10. Humano aprueba/merge.

## Estrategia multi-agente
- 1 branch = 1 agente = 1 skill de módulo.
- Módulos independientes (forms, landings, campaigns) pueden ir en paralelo.
- Flows depende de los demás módulos (trigger sources) → último o tras los demás.

## Naming de branches (libre, sugerencia)
- `feat/landings-builder`
- `feat/flows-engine`
- `feat/contacts-csv-import`
- `chore/sdd-update-data-model`
