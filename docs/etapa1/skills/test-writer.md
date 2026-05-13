# Skill: test-writer

## Cuándo usarla
Etapa 2 (QA) o cuando un agente termina una feature y debe agregar tests.

## Stack
- **Unit:** Vitest.
- **E2E:** Playwright.

## Ubicación
- Unit: `tests/unit/<dominio>/<archivo>.test.ts` o junto al servicio `__tests__/`.
- E2E: `tests/e2e/<flujo>.spec.ts`.

## Reglas
- Cada server action crítica → al menos 3 tests: happy path, validación falla, sin permisos.
- Cada webhook → idempotencia + firma inválida + happy path.
- Tests usan DB de prueba (SQLite o MariaDB local).
- Seed con factories pequeñas (`tests/factories.ts`).
- No tests que dependan de orden.

## Patrón unit (Vitest)
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createContact } from "@/lib/services/contacts";
import { resetDb, mockSession } from "@/tests/helpers";

describe("createContact", () => {
  beforeEach(() => resetDb());

  it("crea contacto válido", async () => {
    mockSession({ role: "VENDEDOR" });
    const r = await createContact({ name:"A", email:"a@a.com" });
    expect(r.ok).toBe(true);
  });

  it("falla email duplicado", async () => {
    mockSession({ role: "VENDEDOR" });
    await createContact({ name:"A", email:"a@a.com" });
    const r = await createContact({ name:"B", email:"a@a.com" });
    expect(r.ok).toBe(false);
  });

  it("rechaza sin sesión", async () => {
    mockSession(null);
    const r = await createContact({ name:"A", email:"a@a.com" });
    expect(r.error.code).toBe("UNAUTHORIZED");
  });
});
```

## Patrón E2E (Playwright)
```ts
import { test, expect } from "@playwright/test";

test("crear contacto y verlo en lista", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name=email]', "admin@test.com");
  await page.fill('[name=password]', "test1234");
  await page.click('button[type=submit]');

  await page.goto("/crm/contactos/nuevo");
  await page.fill('[name=name]', "Juan");
  await page.fill('[name=email]', "juan@test.com");
  await page.click('button:has-text("Guardar")');

  await expect(page.locator("text=Juan")).toBeVisible();
});
```

## Cobertura mínima MVP
- `contacts.createContact`, `contacts.importCsv` dedupe.
- `deals.moveDeal` audit.
- `forms.submitForm` happy + condicional.
- `sales.webhook` idempotencia + firma.
- `campaigns.sendCampaign` estado SENDING/SENT/PARTIAL.

## Done
- `pnpm test` y `pnpm test:e2e` verde.
- Sin tests skipeados.
