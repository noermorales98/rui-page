# Skill: module-dashboard

## Alcance
`/crm/dashboard`. KPIs + actividad reciente.

## Pre-lectura
- `sdd-loader`, `role-guard`.

## KPIs (todos respetando soft-delete y permisos)
1. **Contactos totales** (Contact `deletedAt:null`).
2. **Contactos por status** (NEW/QUALIFIED/CLIENT).
3. **Ingresos pagados** este mes (sum `amountCents` CrmSale PAID).
4. **Ticket promedio** (avg `amountCents` CrmSale PAID).
5. **Pipeline abierto** (count Deal en LEAD/DEMO/NEGOTIATION).
6. **Webinars próximos** (Webinar `date >= now`, top 5).
7. **Respuestas formularios** (count CrmFormSubmission últimos 7 días).
8. **Emails enviados** (sum `sentCount` CrmCampaign canal EMAIL últimos 30 días).
9. **WhatsApp enviados** (sum `sentCount` canal WA últimos 30 días).

## Estructura
```
app/crm/dashboard/
  page.tsx
  _components/
    KpiCard.tsx
    KpiGrid.tsx
    UpcomingWebinarsList.tsx
    ActivityFeed.tsx
    StatusBreakdown.tsx
lib/services/dashboard.ts
```

## Server actions / queries
- `getDashboardKpis(range = "30d")`.
- `getRecentActivity(limit = 20)` → últimos `ContactActivity` con contact incluido.
- `getUpcomingWebinars(limit = 5)`.

## Performance
- Queries en paralelo con `Promise.all`.
- Si crece volumen: vistas materializadas o caché Vercel KV.
- Usar `COUNT()` + agregados, no `findMany().length`.

## UI
- Grid 3–4 columnas en desktop, 1 en mobile.
- Cards con: valor grande, delta vs periodo previo (futuro), subtítulo descriptivo.
- Activity feed: lista con avatar inicial, contact name, acción, fecha relativa.

## Permisos
- ASISTENTE: no ve KPIs financieros (ingresos, ticket).
- VENDEDOR y ADMIN: ven todo.

## Testing
- Unit: cada query con datos de seed.
- E2E: cargar dashboard, ver 9 KPIs.

## Done
- Carga < 1s con dataset típico.
- Sin N+1 queries.
