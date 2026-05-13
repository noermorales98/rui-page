# Skill: module-contacts

## Alcance
Módulo `/crm/contactos`. CRUD, tags, import CSV, timeline.

## Pre-lectura
- `sdd-loader`
- `zod-validator`
- `role-guard`
- `audit-logger`
- `prisma-migration` (si cambias schema)

## Estructura esperada
```
app/crm/contactos/
  page.tsx                          # listado paginado
  nuevo/page.tsx                    # form crear
  [id]/page.tsx                     # detalle + timeline
  [id]/editar/page.tsx
  importar/page.tsx                 # CSV
  _components/
    ContactsTable.tsx
    ContactFilters.tsx
    ContactForm.tsx
    CsvImporter.tsx
    ActivityTimeline.tsx
    TagPicker.tsx
lib/services/contacts.ts
lib/validators/contacts.ts
```

## Server actions a implementar
Ver `API_SPEC.md §4.1`. Mínimo:
- `listContacts`, `getContact`
- `createContact`, `updateContact`, `softDeleteContact`
- `importContactsCsv`
- `addTag`, `removeTag`
- `addActivity`

## Reglas de negocio
- Email único + required.
- Submission de form duplicado por email → `updateContact` (no crear).
- Soft delete: filtrar `deletedAt: null` siempre que no sea vista de admin.
- Status sube automático según `BUSINESS_RULES.md §2.1`.

## UI
- Tabla paginada, columnas: nombre, email, status badge, fuente badge, fecha, acciones.
- Filtros sticky en topbar: status (multi), source (multi), search (nombre/email/phone).
- Detalle: 2 columnas → info principal + timeline (`ContactActivity` desc).

## CSV import
- Acepta columnas: `name,email,phone,source`.
- Validar fila por fila con Zod.
- Reporte: `{ inserted, updated, errors: [{row, message}] }`.
- Hacer batch insert con `prisma.$transaction`.

## Testing mínimo
- Unit: dedupe por email, status transitions.
- E2E: crear contacto, importar CSV con 1 duplicado.

## Done
- Lint + typecheck OK.
- AuditLog presente en mutaciones.
- Doc actualizado si cambió contrato.
