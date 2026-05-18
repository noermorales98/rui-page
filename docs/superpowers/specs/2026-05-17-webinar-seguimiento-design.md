# Webinar Seguimiento — Design Spec

**Fecha:** 2026-05-17  
**Ruta:** `/crm/webinars/[id]/seguimiento`  
**Estado:** Aprobado

---

## Objetivo

Vista central de seguimiento comercial para un webinar. Permite al equipo de ventas ver quién se registró, quién asistió, el estado comercial de cada lead y ejecutar acciones rápidas sin salir de la pantalla.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| ¿MVP con datos existentes o extender schema? | Extender schema con `CommercialStatus` |
| Lead score | Auto-calculado por comportamiento, sin campo en BD |
| Vendedor asignado | Sin asignación por ahora; se muestra el deal del contacto si existe |
| Ingresos generados | Suma de `CrmSale.amount` (status=PAID) vinculadas a contactos del webinar |
| Próxima acción / Tareas | Placeholder deshabilitado; Task es una spec separada |
| Enfoque arquitectónico | Ruta separada, datos en servidor, filtros + acciones en cliente (optimistic) |

---

## Schema — Cambios a Prisma

### Nuevo enum

```prisma
enum CommercialStatus {
  SIN_CONTACTAR
  CONTACTADO
  INTERESADO
  PLAN_PAGOS
  NO_RESPONDE
  DESCARTADO
}
```

### Campo nuevo en `WebinarRegistration`

```prisma
commercialStatus CommercialStatus @default(SIN_CONTACTAR)
```

Una migración, sin breaking changes en datos existentes.

---

## Arquitectura

### Ruta y componentes

```
app/crm/webinars/[id]/seguimiento/
  page.tsx                      ← server component: fetch + pass props
  _components/
    SeguimientoMetrics.tsx      ← 7 tarjetas de métricas
    SeguimientoFilters.tsx      ← chips de filtro (client)
    SeguimientoTable.tsx        ← tabla principal (client)
    RowActionsMenu.tsx          ← dropdown de acciones por fila (client)
    CreateDealModal.tsx         ← modal crear oportunidad (client)
    AddNoteModal.tsx            ← modal registrar nota (client)
  actions.ts                    ← Server Actions
```

### Estrategia de datos

El server component realiza **una sola query Prisma** que incluye por cada `WebinarRegistration`:

```ts
registrations: {
  include: {
    contact: {
      select: {
        id, name, email, phone,
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
        deals: { include: { sales: true } },
      }
    }
  }
}
```

Todos los datos llegan al cliente como props. Los filtros se aplican con `useState` sin requests adicionales.

### Enlace desde página del webinar

`app/crm/webinars/[id]/page.tsx` agrega un 4° tab "Seguimiento" que es un `Link` a `/crm/webinars/[id]/seguimiento` (no un `?tab=`, porque tiene su propia page con fetch propio).

---

## Lead Score (auto-calculado)

Función pura `calcLeadScore(reg)` → `'CALIENTE' | 'TIBIO' | 'FRIO'`:

| Condición (evaluada en orden) | Score |
|---|---|
| `status === 'PURCHASED'` | CALIENTE |
| `status === 'ATTENDED'` y `commercialStatus` es `INTERESADO` o `PLAN_PAGOS` | CALIENTE |
| `commercialStatus` es `NO_RESPONDE` o `DESCARTADO` | FRIO |
| `status === 'ATTENDED'` | TIBIO |
| todo lo demás | TIBIO |

---

## UI — Métricas superiores

7 tarjetas usando el patrón `statCard` de `WebinarStats`:

| Métrica | Cálculo |
|---|---|
| Total registrados | `registrations.length` |
| Asistentes | `status === 'ATTENDED' \|\| status === 'PURCHASED'` |
| No asistieron | `total - asistentes` |
| Compradores | `status === 'PURCHASED'` |
| Conv. asist → venta | `compradores / asistentes * 100` |
| Ingresos generados | Suma `CrmSale.amount` (status=PAID) de contactos del webinar. Nota: aproximación — puede incluir ventas no relacionadas al webinar si el contacto compró otra cosa. |
| Leads calientes | Registros con `calcLeadScore === 'CALIENTE'` |

---

## UI — Filtros

Chips horizontales scrolleables. Estado en `useState<FilterKey>`.

| Chip | Lógica |
|---|---|
| Todos | sin filtro |
| Registrados | `status === 'REGISTERED'` |
| Asistieron | `status === 'ATTENDED' \|\| status === 'PURCHASED'` |
| No asistieron | `status === 'REGISTERED'` (no attended/purchased) |
| Compraron | `status === 'PURCHASED'` |
| No compraron | `status !== 'PURCHASED'` |
| Contactados | `commercialStatus !== 'SIN_CONTACTAR'` |
| Sin contactar | `commercialStatus === 'SIN_CONTACTAR'` |
| Lead caliente | `calcLeadScore === 'CALIENTE'` |
| Plan de pagos | `commercialStatus === 'PLAN_PAGOS'` |
| Seguimiento vencido | Deshabilitado (tooltip "Próximamente — requiere módulo de Tareas") |

---

## UI — Tabla principal

### Columnas

| Columna | Fuente | Editable |
|---|---|---|
| Contacto | `contact.name` → link a `/crm/contactos/[id]` | No |
| Email | `contact.email` | No |
| Tel / WhatsApp | `contact.phone` (guión si null) | No |
| Estado registro | `registration.status` | Inline select |
| Lead score | `calcLeadScore(reg)` | No (badge coloreado) |
| Estado comercial | `commercialStatus` | Inline select |
| Última actividad | `contact.activities[0].createdAt` relativo (ej. "hace 2h") | No |
| Acciones | Botón "···" | — |

### Colores de badges

**Lead score:**
- CALIENTE → `color-tertiary-container / on-tertiary-container`
- TIBIO → `color-secondary-container / on-secondary-container`
- FRIO → `color-surface-container-high / on-surface-variant`

**Estado comercial:**
- SIN_CONTACTAR → surface-container-high (neutro)
- CONTACTADO → primary-container
- INTERESADO → secondary-container
- PLAN_PAGOS → tertiary-container
- NO_RESPONDE → error-container
- DESCARTADO → surface-container-high (desaturado)

---

## UI — Acciones rápidas (dropdown "···")

```
Ver contacto           → Link a /crm/contactos/[id]
Crear oportunidad      → Abre CreateDealModal (campos: nombre del curso, stage inicial). Deshabilitado si el contacto ya tiene un Deal activo para este webinar.
Mover en pipeline      → Submenu: LEAD / DEMO / NEGOTIATION / ENROLLED. Si el contacto no tiene Deal, el submenu está deshabilitado con tooltip "Crea una oportunidad primero".
─────────────────────────────────────
Marcar como contactado → updateCommercialStatus('CONTACTADO') optimista
Marcar como interesado → updateCommercialStatus('INTERESADO') optimista
Marcar como no responde→ updateCommercialStatus('NO_RESPONDE') optimista
─────────────────────────────────────
Enviar WhatsApp        → window.open('https://wa.me/[phone]') — oculto si sin teléfono
Enviar email           → href="mailto:[email]"
─────────────────────────────────────
Registrar nota         → Abre AddNoteModal
Crear tarea            → disabled + tooltip "Próximamente"
```

---

## Server Actions (`actions.ts`)

| Acción | Operación Prisma |
|---|---|
| `updateCommercialStatus(registrationId, CommercialStatus)` | `webinarRegistration.update` → revalidate seguimiento page |
| `createDeal(contactId, courseName, stage)` | `deal.upsert` por contactId+courseName |
| `moveDealStage(dealId, stage)` | `deal.update` |
| `addNote(contactId, body)` | `contactActivity.create` tipo NOTE |
| `updateRegistrationStatus` | Reutilizar de `webinars/actions.ts` |

Todas siguen el patrón: `'use server'`, `auth()` guard, try/catch, `revalidatePath`.

---

## Flujo optimista

1. Usuario hace acción rápida de cambio de estado
2. `RowActionsMenu` llama a setter local → UI actualiza inmediatamente
3. `startTransition(() => serverAction(...))` en segundo plano
4. Error → revierte estado local + toast de error
5. Éxito → `revalidatePath` actualiza cache del servidor silenciosamente

Mismo patrón que `ParticipantsTable` usa para `updateRegistrationStatus`.

---

## Criterios de aceptación

- Un vendedor puede abrir `/crm/webinars/[id]/seguimiento` y ver todos los contactos del webinar con sus datos comerciales
- Puede filtrar por cualquier chip sin recarga de página
- Puede cambiar estado comercial y de registro inline con feedback inmediato
- Puede crear una oportunidad y registrar una nota sin salir de la pantalla
- Las 7 métricas superiores reflejan el estado actual del webinar
- El botón "Crear tarea" es visible pero deshabilitado con tooltip explicativo
- La pantalla es accesible desde el tab "Seguimiento" en `/crm/webinars/[id]/`
