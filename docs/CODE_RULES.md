# CODE_RULES — CRM Rui

## 1. TypeScript
- `strict: true`. Sin `any` salvo justificado con comentario.
- Tipos públicos de servicios viven en `types/` o junto al servicio (`.types.ts`).
- Evitar `unknown` no manejado.

## 2. Estructura de archivos
- Una responsabilidad por archivo.
- Server actions y queries: `lib/services/<dominio>.ts`.
- Validadores Zod: `lib/validators/<dominio>.ts`.
- Componentes UI base: `components/ui/<Componente>.tsx`.
- Componentes de feature: `app/crm/<modulo>/_components/<Componente>.tsx`.
- Helpers genéricos: `lib/utils/`.

## 3. Server / Client components
- Server por defecto.
- `"use client"` solo cuando: state, effects, eventos del DOM, libs cliente-only (dnd-kit, editores).
- Pasar datos serializables como props desde server → client.
- No fetch en client si el server puede hacerlo.

## 4. Server actions
- Archivo o función inicia con `"use server"`.
- Primera línea: validar input con Zod (`schema.safeParse`).
- Segunda: `requireRole(...)` cuando aplique.
- Try/catch envolviendo Prisma + side effects.
- Retornar `{ ok, data | error }` consistente (ver `API_SPEC.md`).
- Llamar `logAudit(...)` y/o `addActivity(...)` cuando aplique.

## 5. Prisma
- Cliente único en `lib/db/prisma.ts`.
- En servicios: NUNCA importar Prisma en componentes; siempre vía service.
- Transacciones (`prisma.$transaction`) para operaciones multi-tabla.
- Soft delete: filtrar por `deletedAt: null` en queries de lectura por defecto.

## 6. Errores
- No filtrar mensajes internos al cliente. Mapear a códigos en `API_SPEC.md`.
- Log estructurado (JSON) en server: `{ level, msg, context, error }`.

## 7. Naming
- Archivos: `kebab-case.ts` para utils, `PascalCase.tsx` para componentes.
- Tipos: `PascalCase`.
- Funciones: `camelCase`.
- Constantes globales: `SCREAMING_SNAKE`.
- Tablas/modelos Prisma: ya definidos en schema.

## 8. Imports
- Alias `@/` apunta a la raíz del proyecto.
- Orden: built-ins → libs externas → alias internos → relativos.
- Sin imports circulares.

## 9. Lint / format
- ESLint config Next 16 + reglas estrictas (no-explicit-any, no-unused-vars, exhaustive-deps).
- Pretier-like formatting de defecto Next.
- Pre-commit (futuro): `lint` + `typecheck`.

## 10. Tests
- Unit: Vitest en `__tests__/` junto al servicio o `tests/unit/`.
- E2E: Playwright en `tests/e2e/`.
- Cobertura mínima en MVP: services críticos (sales, campaigns, forms submit, stripe webhook).

## 11. Commits / branches
- `main` protegida.
- Branches: `feat/<modulo>-<detalle>`, `fix/<...>`, `chore/<...>`.
- Commits: convencionales (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).

## 12. Secretos
- `.env.local` ignorado.
- `.env.example` siempre actualizado.
- Producción: variables en Vercel.

## 13. Reglas para agentes IA
- Antes de tocar código: leer `PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `CODE_RULES.md`.
- Antes de tocar un módulo: leer su skill (ver Etapa 1).
- Nunca inventar campos del schema.
- Nunca importar libs no listadas en `package.json` sin actualizar este doc.
- Si falta info: preguntar, no asumir.
