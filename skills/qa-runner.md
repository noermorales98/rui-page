# Skill: qa-runner

## Cuándo usarla
- Al final de una feature, antes de abrir PR.
- Antes de mergear a `main`.
- Cuando un agente termina un sprint completo.

## Pre-lectura
- `docs/sdd/QA_STRATEGY.md` (o equivalente en repo).
- `test-writer.md`
- La skill del módulo trabajado.

## Objetivo
Ejecutar la suite, recoger resultados, generar un **reporte estructurado** que el humano pueda leer en 2–5 minutos y decidir merge / cambios.

## Pasos
1. Asegurar servicios up:
   ```bash
   docker compose -f docker-compose.test.yml up -d
   # MariaDB local schema crm_test
   # Mailpit en :8025 (UI) y :1025 (SMTP)
   ```
2. Si la feature toca Stripe → abrir en otra terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Ejecutar en orden:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test:run --coverage
   pnpm test:e2e
   ```
4. Recolectar:
   - Salida de cada comando.
   - JSON de Vitest (`test:run --reporter=json --outputFile=.qa/vitest.json`).
   - Reporte HTML de Playwright (`playwright-report/`).
   - Coverage (`coverage/coverage-summary.json`).

## Reporte (output del agente)

Archivo: `.qa/report.md`

```md
# QA Report — branch `<branch>` — <fecha>

## Resumen
- Lint: ✅ / ❌ (N errores)
- TypeCheck: ✅ / ❌ (N errores)
- Unit: ✅ / ❌ (X passed / Y failed / Z skipped)
- E2E: ✅ / ❌ (X passed / Y failed)
- Coverage críticos: <%>

## Detalle de fallos

### Unit
- `tests/unit/services/sales.test.ts > recordSaleFromStripe > idempotencia`
  - Error: `Expected 1 sale, got 2`
  - Posible causa: índice unique `eventId` no aplicado.
  - Sugerencia: revisar migración `prisma/migrations/.../`.

### E2E
- `tests/e2e/forms-public-submit.spec.ts > "submit con condicional oculto"`
  - Falla en línea 42: `expect(page.locator("text=Recibimos")).toBeVisible()`
  - Screenshot: `playwright-report/.../trace.zip`
  - Posible causa: redirect del flow se ejecutó cuando no debía.

## Críticos cubiertos
- [x] Auth: login / rol
- [x] Contactos: crear / dedupe / soft delete
- [x] Pipeline: move + audit
- [ ] Forms submit con condicional  ⚠️
- [x] Stripe webhook firma + idempotencia
- [x] Campaigns email vía Mailpit
- [x] Flow engine: cron tick
- [x] Permisos: matriz parcial
- [ ] Rate limit: form submit  ⚠️

## Coverage por servicio crítico
| Servicio | Lines | Branches |
|---|---|---|
| contacts | 92% | 85% |
| sales    | 78% | 70% |
| campaigns| 65% | 60% |  ⚠️ bajo
| flows/engine | 88% | 80% |

## SDD: cambios detectados sin reflejo en docs
- `prisma/schema.prisma`: campo `Landing.faviconUrl` no aparece en `DATA_MODEL.md`.

## Veredicto sugerido
- 🟡 NEEDS_CHANGES (1 e2e falla bloqueante)
- O: 🟢 APPROVED_WITH_NOTES (si arreglas el e2e y agregas test rate-limit)

## Próximos pasos
1. Arreglar e2e form submit con condicional.
2. Cubrir rate-limit en `tests/unit/integrations/rate-limit.test.ts`.
3. Actualizar `DATA_MODEL.md` con `faviconUrl`.
4. Re-ejecutar `qa-runner`.
```

## Reglas
- No abrir PR sin haber corrido `qa-runner` al menos una vez con éxito en lint + typecheck.
- Cualquier test rojo bloquea merge a `main`.
- Cobertura baja en críticos → reportar pero no bloquear (decisión humana).
- Si un servicio externo cae (Mailpit, Stripe CLI), reportar como **infra issue**, no como bug del código.

## Comandos del package.json esperados
```json
{
  "scripts": {
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "verify": "pnpm lint && pnpm typecheck && pnpm test:run",
    "qa": "pnpm verify && pnpm test:e2e"
  }
}
```

## Output esperado al humano
Un mensaje corto:
> "QA completo. Veredicto: 🟢 APPROVED. Ver `.qa/report.md`. Listo para merge."

o

> "QA completo. Veredicto: 🔴 NEEDS_CHANGES. 1 e2e falla. Ver `.qa/report.md` §Detalle."

## Anti-patrones
- Marcar APPROVED con tests rojos.
- Reportar sin abrir archivos de error reales.
- Ignorar warnings de typecheck.
- Re-ejecutar tests "hasta que pase" sin investigar flaky.
