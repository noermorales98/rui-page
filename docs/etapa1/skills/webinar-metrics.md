# Skill: webinar-metrics

## Cuándo usarla
Cualquier vista/widget que muestre métricas por webinar o agregadas.

## Pre-lectura
- `module-webinars.md`
- `module-dashboard.md`
- `performance.md`

## Métricas por webinar
1. **Registrados** — count `WebinarRegistration` (status ≥ REGISTERED).
2. **Asistentes** — count con `status IN (ATTENDED, PURCHASED)`.
3. **Compradores** — count con `status = PURCHASED`.
4. **% asistencia** — asistentes / registrados.
5. **% conversión** — compradores / asistentes.
6. **% conversión total** — compradores / registrados.
7. **Ingresos atribuidos** — sum `CrmSale.amountCents` donde el contact tiene registration en este webinar y la venta es posterior a `Webinar.date`.

## Métricas agregadas (todos los webinars)
- Total registrados últimos 30/90 días.
- Asistencia promedio.
- Conversión promedio.
- Top 5 webinars por conversión.
- Top 5 webinars por ingresos.

## Tabla detalle por webinar
| Webinar | Fecha | Plataforma | Registrados | Asistentes | Compradores | %Asist | %Conv | Ingresos |
|---|---|---|---|---|---|---|---|---|

## Implementación

### Servicio
```ts
// lib/services/webinar-metrics.ts
export async function getWebinarStats(webinarId: number) {
  const [registered, attended, purchased, revenue] = await prisma.$transaction([
    prisma.webinarRegistration.count({
      where: { webinarId, deletedAt: null },
    }),
    prisma.webinarRegistration.count({
      where: { webinarId, status: { in: ["ATTENDED","PURCHASED"] } },
    }),
    prisma.webinarRegistration.count({
      where: { webinarId, status: "PURCHASED" },
    }),
    prisma.crmSale.aggregate({
      _sum: { amountCents: true },
      where: {
        status: "PAID",
        deletedAt: null,
        contact: {
          registrations: { some: { webinarId } },
        },
        soldAt: { gte: webinar.date }, // requiere pasar fecha
      },
    }),
  ]);

  return {
    registered,
    attended,
    purchased,
    attendanceRate: registered ? attended / registered : 0,
    conversionFromAttended: attended ? purchased / attended : 0,
    conversionFromRegistered: registered ? purchased / registered : 0,
    revenueCents: revenue._sum.amountCents ?? 0,
  };
}
```

### Atribución de venta a webinar
Reglas:
- Una venta cuenta para un webinar si:
  - el contact tiene registration al webinar, **y**
  - `soldAt >= webinar.date`, **y**
  - `soldAt <= webinar.date + 60 días` (ventana atribución configurable).
- Si el contact registró en varios webinars, la venta cuenta para todos los que cumplan ventana (no se divide).
- Configurable en `lib/services/webinar-metrics.ts` con constante `ATTRIBUTION_WINDOW_DAYS = 60`.

### Auto-marcar `PURCHASED`
Cuando se registra venta:
```ts
async function maybeMarkPurchasedRegistrations(saleId: number) {
  const sale = await prisma.crmSale.findUnique({ where:{id:saleId} });
  if (!sale || sale.status !== "PAID") return;
  await prisma.webinarRegistration.updateMany({
    where: {
      contactId: sale.contactId,
      status: { in: ["REGISTERED","ATTENDED"] },
      webinar: { date: { lte: sale.soldAt, gte: subDays(sale.soldAt, ATTRIBUTION_WINDOW_DAYS) } },
    },
    data: { status: "PURCHASED" },
  });
}
```

## Performance
- Query agregada por webinar: usar `groupBy` cuando muestres tabla de todos.
```ts
const byWebinar = await prisma.webinarRegistration.groupBy({
  by: ["webinarId","status"],
  _count: { _all: true },
});
```
- Cachear stats agregadas (Vercel KV o `cache()` de React por request).

## UI
- KpiCard por métrica clave.
- Tabla con sort por columnas (registrados, asistencia, conversión, ingresos).
- Filtros: rango de fechas, plataforma.
- Botón export CSV.

## Reglas
- Soft-delete: ignorar webinars y ventas con `deletedAt`.
- Permisos: ASISTENTE ve métricas no financieras; VENDEDOR y ADMIN ven todo (incluye ingresos).
- Atribución es **leída**, no almacenada. Si cambias `ATTRIBUTION_WINDOW_DAYS`, los reportes cambian (esperado).

## Testing
- Unit: stats con 0 registrados (sin división por cero).
- Unit: atribución dentro y fuera de ventana.
- E2E: crear webinar, registrar contactos, marcar asistencia, registrar venta → ver métricas actualizadas.

## Done
- Tabla detalle carga < 1s con 100 webinars.
- Atribución correcta en bordes (mismo día, último día de ventana).
- Sin ingresos atribuidos a ventas previas al webinar.
